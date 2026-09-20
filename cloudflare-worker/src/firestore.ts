/**
 * Cliente REST nativo para Google Cloud Firestore no Cloudflare Workers
 * Autentica usando Web Crypto API nativa (zero dependências de Node.js ou gRPC nativo).
 */

export interface Env {
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY?: string;
  TELEGRAM_BOT_TOKEN: string;
  API_SECRET_KEY?: string; // Senha para proteger a API
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

// Função auxiliar para converter PEM PKCS#8 em ArrayBuffer
function pemToBinary(pem: string): ArrayBuffer {
  // 1. Remove cabeçalhos, rodapés e quebras de linha literais (\n, \r) caso a chave tenha sido colada como string escapada
  let clean = pem
    .replace(/-----BEGIN[^-]+-----/g, '')
    .replace(/-----END[^-]+-----/g, '')
    .replace(/BEGIN PRIVATE KEY/ig, '')
    .replace(/END PRIVATE KEY/ig, '')
    .replace(/\\n/g, '')
    .replace(/\\r/g, '');

  // 2. Remove TUDO que não for caractere válido de base64 (A-Z, a-z, 0-9, +, /)
  clean = clean.replace(/[^A-Za-z0-9+/]/g, '');

  // 3. Hack extremo de robustez: Chaves RSA PKCS#8 do Firebase SEMPRE começam com 'MII' em base64.
  // Se houver lixo antes disso (ex: uma letra 'n' solta de um \n mal colado), nós cortamos.
  const startIdx = clean.indexOf('MII');
  if (startIdx > -1 && startIdx < 10) {
    clean = clean.substring(startIdx);
  }

  // 4. Adiciona o preenchimento correto de '=' no final para que o tamanho seja múltiplo de 4
  while (clean.length % 4 !== 0) {
    clean += '=';
  }

  const binaryString = atob(clean);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Codificador Base64Url seguro para UTF-8 e binários
function base64UrlEncode(data: string | Uint8Array): string {
  let bytes: Uint8Array;
  if (typeof data === 'string') {
    bytes = new TextEncoder().encode(data);
  } else {
    bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Gera ou reaproveita um token OAuth2 para a API do Firestore
 */
export async function getGoogleAccessToken(env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 300) {
    return cachedAccessToken.token;
  }

  const privateKeyPem = env.FIREBASE_PRIVATE_KEY;
  if (!privateKeyPem) {
    throw new Error('FIREBASE_PRIVATE_KEY não configurada no ambiente do Worker.');
  }

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const claim = {
    iss: env.FIREBASE_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaim = base64UrlEncode(JSON.stringify(claim));
  const unsignedToken = `${encodedHeader}.${encodedClaim}`;

  const keyBuffer = pemToBinary(privateKeyPem);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: { name: 'SHA-256' }
    },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  const jwt = `${unsignedToken}.${encodedSignature}`;

  // Troca JWT por Access Token do Google
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao obter Google Access Token: ${response.status} ${errorText}`);
  }

  const data: any = await response.json();
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in || 3600)
  };

  return data.access_token;
}

// Converte Objeto JS para formato Firestore REST Value
export function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: val.toString() };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

// Converte Formato Firestore REST Value para Objeto JS padrão
export function fromFirestoreValue(val: any): any {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(fromFirestoreValue);
  }
  if ('mapValue' in val) {
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      obj[k] = fromFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

export function fromFirestoreDoc(doc: any): any {
  if (!doc) return null;
  const id = doc.name ? doc.name.split('/').pop() : '';
  const obj: Record<string, any> = { id };
  for (const [k, v] of Object.entries(doc.fields || {})) {
    obj[k] = fromFirestoreValue(v);
  }
  return obj;
}

export function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'id') continue;
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}

export class FirestoreClient {
  private env: Env;
  private baseUrl: string;

  constructor(env: Env) {
    this.env = env;
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
  }

  private async fetchAuth(url: string, init?: RequestInit): Promise<Response> {
    const token = await getGoogleAccessToken(this.env);
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    return fetch(url, { ...init, headers });
  }

  async listDocuments(collection: string): Promise<any[]> {
    const res = await this.fetchAuth(`${this.baseUrl}/${collection}`);
    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error(`Erro ao listar ${collection}: ${res.status}`);
    }
    const data: any = await res.json();
    return (data.documents || []).map(fromFirestoreDoc);
  }

  async getDocument(collection: string, id: string): Promise<any | null> {
    const res = await this.fetchAuth(`${this.baseUrl}/${collection}/${id}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Erro ao buscar doc ${id}: ${res.status}`);
    }
    const data: any = await res.json();
    return fromFirestoreDoc(data);
  }

  async setDocument(collection: string, id: string, data: Record<string, any>): Promise<any> {
    const fields = toFirestoreFields(data);
    const res = await this.fetchAuth(`${this.baseUrl}/${collection}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields })
    });
    if (!res.ok) {
      throw new Error(`Erro ao salvar doc ${id}: ${res.status}`);
    }
    const saved: any = await res.json();
    return fromFirestoreDoc(saved);
  }

  async addDocument(collection: string, data: Record<string, any>): Promise<any> {
    const fields = toFirestoreFields(data);
    const res = await this.fetchAuth(`${this.baseUrl}/${collection}`, {
      method: 'POST',
      body: JSON.stringify({ fields })
    });
    if (!res.ok) {
      throw new Error(`Erro ao adicionar doc: ${res.status}`);
    }
    const saved: any = await res.json();
    return fromFirestoreDoc(saved);
  }

  async deleteDocument(collection: string, id: string): Promise<boolean> {
    const res = await this.fetchAuth(`${this.baseUrl}/${collection}/${id}`, {
      method: 'DELETE'
    });
    return res.ok;
  }
}
