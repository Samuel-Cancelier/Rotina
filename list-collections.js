const fs = require('fs');
const crypto = require('crypto');

async function getAccessToken() {
  const json = JSON.parse(fs.readFileSync("./chave-firebase.json", "utf8"));
  
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: json.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedClaim = Buffer.from(JSON.stringify(claim)).toString('base64url');
  const unsignedToken = `${encodedHeader}.${encodedClaim}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  const signature = signer.sign(json.private_key, 'base64url');
  const jwt = `${unsignedToken}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  
  const data = await res.json();
  return data.access_token;
}

async function run() {
  const token = await getAccessToken();
  
  // Use runQuery to fetch all documents across all collections to see what we have
  // Wait, runQuery needs a proper structured query.
  // We can just use the batchGet or check what we usually do to list collections.
  // Actually, let's just make a query to "registros" and "atividades"
  const res3 = await fetch("https://firestore.googleapis.com/v1/projects/rotina-94433/databases/(default)/documents/registros", {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("registros status:", res3.status);
  console.log(await res3.text());
  
  const res4 = await fetch("https://firestore.googleapis.com/v1/projects/rotina-94433/databases/(default)/documents/registros_mensais", {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("registros_mensais status:", res4.status);
  console.log(await res4.text());
}
run();
