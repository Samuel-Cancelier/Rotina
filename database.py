"""
Módulo de Banco de Dados (database.py)
Gerencia a conexão com o Firebase Firestore e operações para a arquitetura de 3 níveis:
1. Pilares Soberanos (Metas em Pontos e Pesos no Score Geral)
2. Categorias Quantitativas (Metas Puras em unidades: km, páginas, horas)
3. Atividades (Segmentação de hábitos e rotina)
4. Registros Mensais e Feitos (/feito do Telegram)
"""

import os
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore import DocumentReference

# Caminho para a chave de serviço do Firebase
KEY_PATH = os.environ.get("FIREBASE_CREDENTIALS_PATH", "chave-firebase.json")

# Inicialização do Firebase Admin SDK
if not firebase_admin._apps:
    if os.path.exists(KEY_PATH):
        try:
            cred = credentials.Certificate(KEY_PATH)
            firebase_admin.initialize_app(cred)
        except Exception:
            firebase_admin.initialize_app()
    else:
        # Permite uso de credenciais padrão do Google Cloud Run quando em produção
        firebase_admin.initialize_app()

db = firestore.client()

# =====================================================================
# 1. PILARES SOBERANOS
# =====================================================================

PILARES_PADRAO = [
    {
        "id": "pilar_atividade_fisica",
        "numero": 1,
        "nome": "Atividade Física",
        "meta_pontos_mensal": 60,
        "peso_no_score_geral": 30,
        "tem_meta": True,
        "cor": "#10b981"
    },
    {
        "id": "pilar_estudos",
        "numero": 2,
        "nome": "Estudos e Leitura",
        "meta_pontos_mensal": 50,
        "peso_no_score_geral": 25,
        "tem_meta": True,
        "cor": "#3b82f6"
    },
    {
        "id": "pilar_trabalho",
        "numero": 3,
        "nome": "Trabalho",
        "meta_pontos_mensal": 80,
        "peso_no_score_geral": 30,
        "tem_meta": True,
        "cor": "#6c2efe"
    },
    {
        "id": "pilar_domesticas",
        "numero": 4,
        "nome": "Tarefas Domésticas",
        "meta_pontos_mensal": 30,
        "peso_no_score_geral": 15,
        "tem_meta": True,
        "cor": "#f59e0b"
    },
    {
        "id": "pilar_diversos",
        "numero": 5,
        "nome": "Diversos (sem meta)",
        "meta_pontos_mensal": 0,
        "peso_no_score_geral": 0,
        "tem_meta": False,
        "cor": "#64748b"
    }
]

CORES_PILARES = {
    "pilar_atividade_fisica": "#10b981",
    "pilar_estudos": "#3b82f6",
    "pilar_trabalho": "#6c2efe",
    "pilar_domesticas": "#f59e0b",
    "pilar_diversos": "#64748b"
}

def inicializar_pilares_se_vazio():
    """Garante que os 5 pilares existam no Firestore e atualiza configurações padrão."""
    for pilar in PILARES_PADRAO:
        doc_ref = db.collection("pilares").document(pilar["id"])
        doc_ref.set(pilar, merge=True)

def listar_pilares() -> List[Dict[str, Any]]:
    """Retorna lista de pilares ordenados por número."""
    try:
        docs = db.collection("pilares").stream()
        pilares = [d.to_dict() for d in docs]
        if not pilares:
            inicializar_pilares_se_vazio()
            return PILARES_PADRAO
        for p in pilares:
            pid = p.get("id")
            if pid in CORES_PILARES:
                p["cor"] = CORES_PILARES[pid]
            padrao = next((item for item in PILARES_PADRAO if item["id"] == pid), None)
            if padrao:
                p["numero"] = padrao["numero"]
                if pid == "pilar_estudos":
                    p["nome"] = "Estudos e Leitura"
        pilares.sort(key=lambda x: x.get("numero", 0))
        return pilares
    except Exception:
        return PILARES_PADRAO

# =====================================================================
# 2. COLEÇÃO: categorias
# =====================================================================

def cadastrar_categoria(
    nome: str,
    unidade: str,
    pilar_id: str = "pilar_atividade_fisica",
    pontos_por_unidade: float = 1.0,
    meta_mensal: float = 0.0,
    cor: Optional[str] = None
) -> str:
    """
    Cadastra uma categoria quantitativa vinculada a um Pilar Soberano.
    A cor da categoria é estritamente a cor definida no script para o Pilar correspondente (não muda).
    """
    cor_fixa = CORES_PILARES.get(pilar_id, "#10b981")
    dados = {
        "nome": nome.strip(),
        "pilar_id": pilar_id,
        "unidade_padrao": unidade.strip().lower(),
        "pontos_por_unidade": float(pontos_por_unidade),
        "meta_mensal": float(meta_mensal),
        "cor": cor_fixa,
        "criado_em": firestore.SERVER_TIMESTAMP
    }
    _, doc_ref = db.collection("categorias").add(dados)
    return doc_ref.id

def listar_categorias_dict() -> List[Dict[str, Any]]:
    """Retorna as categorias estruturadas como lista de dicionários com IDs, garantindo a cor fixa do Pilar."""
    try:
        docs = db.collection("categorias").stream()
        categorias = []
        for doc in docs:
            dados = doc.to_dict()
            dados["id"] = doc.id
            # A cor da categoria deve ser sempre a mesma do pilar já setada no script
            dados["cor"] = CORES_PILARES.get(dados.get("pilar_id"), dados.get("cor", "#10b981"))
            categorias.append(dados)
        categorias.sort(key=lambda x: x.get("nome", "").lower())
        return categorias
    except Exception:
        return []

def obter_categoria(categoria_id: str) -> Optional[Dict[str, Any]]:
    """Recupera dados de uma categoria pelo ID ou por nome similar com cor do pilar vinculada."""
    try:
        doc = db.collection("categorias").document(categoria_id).get()
        if doc.exists:
            dados = doc.to_dict()
            dados["id"] = doc.id
            dados["cor"] = CORES_PILARES.get(dados.get("pilar_id"), dados.get("cor", "#10b981"))
            return dados
    except Exception:
        pass
    return None

def buscar_categoria_por_nome(termo: str) -> Optional[Dict[str, Any]]:
    """Busca categoria por correspondência de texto parcial ou exata."""
    categorias = listar_categorias_dict()
    termo_clean = termo.strip().lower()
    for cat in categorias:
        if cat.get("id", "").lower() == termo_clean or cat.get("nome", "").lower() == termo_clean:
            return cat
    for cat in categorias:
        if termo_clean in cat.get("nome", "").lower() or termo_clean in cat.get("id", "").lower():
            return cat
    return None

# =====================================================================
# 3. COLEÇÃO: atividades_cadastradas
# =====================================================================

def cadastrar_atividade(
    nome: str,
    categoria_id: str,
    pilar_id: Optional[str] = None,
    recorrente: bool = True,
    unidade: Optional[str] = None,
    afeta_meta: bool = True
) -> str:
    """
    Cadastra uma atividade vinculada a uma categoria existente.
    """
    cat_dados = obter_categoria(categoria_id) or buscar_categoria_por_nome(categoria_id)
    if not cat_dados:
        raise ValueError(f"Categoria '{categoria_id}' não encontrada.")

    unidade_final = unidade.strip().lower() if unidade else cat_dados.get("unidade_padrao", "un")
    pilar_final = pilar_id or cat_dados.get("pilar_id", "pilar_atividade_fisica")

    dados_atividade = {
        "nome": nome.strip(),
        "categoria_id": cat_dados.get("id", categoria_id),
        "categoria_nome": cat_dados.get("nome", "Sem categoria"),
        "pilar_id": pilar_final,
        "recorrente": bool(recorrente),
        "unidade": unidade_final,
        "afeta_meta": bool(afeta_meta),
        "criado_em": firestore.SERVER_TIMESTAMP
    }

    _, doc_ref = db.collection("atividades_cadastradas").add(dados_atividade)
    return doc_ref.id

def listar_atividades_dict(categoria_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retorna lista de atividades cadastradas."""
    try:
        query = db.collection("atividades_cadastradas")
        if categoria_id:
            query = query.where("categoria_id", "==", categoria_id)
        docs = query.stream()
        atividades = []
        for doc in docs:
            d = doc.to_dict()
            d["id"] = doc.id
            atividades.append(d)
        atividades.sort(key=lambda x: x.get("nome", "").lower())
        return atividades
    except Exception:
        return []

# =====================================================================
# 4. LANÇAMENTO DE /feito E PONTUAÇÃO DE PILARES
# =====================================================================

def registrar_feito(cat_nome_ou_id: str, ativ_nome: str, valor: float) -> Dict[str, Any]:
    """
    Processa o comando /feito [categoria] [atividade] [quantidade].
    1. Localiza a categoria
    2. Atualiza o registro acumulado mensal no Firestore
    3. Converte a quantidade em PONTOS para o Pilar correspondente
    4. Retorna resumo detalhado para resposta do Bot
    """
    cat = buscar_categoria_por_nome(cat_nome_ou_id)
    if not cat:
        raise ValueError(f"Categoria '{cat_nome_ou_id}' não encontrada.")

    agora = datetime.now()
    ano = agora.year
    mes = agora.month
    id_registro = f"reg_{ano}_{mes:02d}_{cat['id']}"

    pontos_unit = float(cat.get("pontos_por_unidade", 1.0))
    pontos_gerados = round(valor * pontos_unit, 2)
    unidade = cat.get("unidade_padrao", "un")
    pilar_id = cat.get("pilar_id", "pilar_atividade_fisica")

    doc_ref = db.collection("registros_mensais").document(id_registro)
    doc = doc_ref.get()

    if doc.exists:
        dados = doc.to_dict()
        novo_total = round(dados.get("valor_total", 0.0) + valor, 2)
        breakdown = dados.get("atividades_breakdown", {})
        breakdown[ativ_nome] = round(breakdown.get(ativ_nome, 0.0) + valor, 2)

        doc_ref.update({
            "valor_total": novo_total,
            "atividades_breakdown": breakdown,
            "atualizado_em": firestore.SERVER_TIMESTAMP
        })
        total_acumulado = novo_total
    else:
        total_acumulado = valor
        doc_ref.set({
            "ano": ano,
            "mes": mes,
            "categoria_id": cat["id"],
            "categoria_nome": cat.get("nome"),
            "pilar_id": pilar_id,
            "valor_total": valor,
            "unidade": unidade,
            "atividades_breakdown": {ativ_nome: valor},
            "atualizado_em": firestore.SERVER_TIMESTAMP
        })

    # Grava também na coleção historico_atividades para sincronizar com a aba Lançamentos
    try:
        db.collection("historico_atividades").add({
            "categoria_id": cat["id"],
            "categoria_nome": cat.get("nome"),
            "pilar_id": pilar_id,
            "atividade_nome": ativ_nome,
            "valor": valor,
            "unidade": unidade,
            "pontos_gerados": pontos_gerados,
            "data_registro": agora.isoformat(),
            "ano": ano,
            "mes": mes
        })
    except Exception as err:
        print(f"Aviso ao salvar histórico de atividade: {err}")

    # Busca nome do pilar
    pilares = listar_pilares()
    pilar_nome = next((p["nome"] for p in pilares if p.get("id") == pilar_id), "Pilar Geral")

    return {
        "categoria_nome": cat.get("nome"),
        "atividade_nome": ativ_nome,
        "valor_lancado": valor,
        "unidade": unidade,
        "total_acumulado": total_acumulado,
        "pontos_gerados": pontos_gerados,
        "pilar_nome": pilar_nome,
        "pilar_id": pilar_id
    }

def calcular_score_geral() -> Dict[str, Any]:
    """
    Calcula o Score Geral Ponderado (0-100) com base nos Pilares Soberanos e registros do mês atual.
    """
    agora = datetime.now()
    ano = agora.year
    mes = agora.month

    pilares = listar_pilares()
    categorias = listar_categorias_dict()

    # Busca registros do mês
    docs = db.collection("registros_mensais").where("ano", "==", ano).where("mes", "==", mes).stream()
    registros_map = {d.to_dict().get("categoria_id"): d.to_dict().get("valor_total", 0.0) for d in docs}

    detalhes_pilares = []
    soma_ponderada = 0.0
    soma_pesos = 0.0

    for pilar in pilares:
        if not pilar.get("tem_meta", False) or pilar.get("peso_no_score_geral", 0) <= 0:
            detalhes_pilares.append({
                "nome": pilar.get("nome"),
                "pontos": 0,
                "meta": 0,
                "atingimento": 100,
                "peso": 0,
                "informativo": True
            })
            continue

        cats_do_pilar = [c for c in categorias if c.get("pilar_id") == pilar["id"]]
        pontos_totais = 0.0

        for c in cats_do_pilar:
            qtd = registros_map.get(c["id"], 0.0)
            fator = float(c.get("pontos_por_unidade", 1.0))
            pontos_totais += qtd * fator

        meta_pts = float(pilar.get("meta_pontos_mensal", 1.0))
        pct = (pontos_totais / meta_pts * 100) if meta_pts > 0 else 100
        pct_capped = min(120.0, pct)

        peso = float(pilar.get("peso_no_score_geral", 0))
        soma_ponderada += pct_capped * peso
        soma_pesos += peso

        detalhes_pilares.append({
            "nome": pilar.get("nome"),
            "pontos": round(pontos_totais, 1),
            "meta": meta_pts,
            "atingimento": round(pct, 1),
            "peso": peso,
            "informativo": False
        })

    score_final = round(soma_ponderada / soma_pesos) if soma_pesos > 0 else 0

    return {
        "score_geral": score_final,
        "mes": mes,
        "ano": ano,
        "pilares": detalhes_pilares
    }

def listar_registros_mensais(ano: int = None, mes: int = None) -> List[Dict[str, Any]]:
    try:
        query = db.collection("registros_mensais")
        if ano:
            query = query.where("ano", "==", ano)
        if mes:
            query = query.where("mes", "==", mes)
        docs = query.stream()
        registros = []
        for doc in docs:
            d = doc.to_dict()
            d["id"] = doc.id
            registros.append(d)
        return registros
    except Exception as e:
        print(f"Erro listar_registros: {e}")
        return []

# =====================================================================
# 5. ATUALIZAÇÃO E EXCLUSÃO (CATEGORIAS, ATIVIDADES, PILARES)
# =====================================================================

def atualizar_pilar(pilar_id: str, dados: Dict[str, Any]) -> bool:
    try:
        # Remover campos de metadados se vierem
        dados_limpos = {k: v for k, v in dados.items() if k not in ["id"]}
        db.collection("pilares").document(pilar_id).set(dados_limpos, merge=True)
        return True
    except Exception as e:
        print(f"Erro atualizar_pilar: {e}")
        return False

def atualizar_categoria(categoria_id: str, dados: Dict[str, Any]) -> bool:
    try:
        dados_limpos = {k: v for k, v in dados.items() if k not in ["id"]}
        if "pilar_id" in dados_limpos:
            dados_limpos["cor"] = CORES_PILARES.get(dados_limpos["pilar_id"], "#10b981")
        elif "cor" in dados_limpos:
            # Não permite desviar da cor do pilar
            del dados_limpos["cor"]
        dados_limpos["atualizado_em"] = firestore.SERVER_TIMESTAMP
        db.collection("categorias").document(categoria_id).set(dados_limpos, merge=True)
        return True
    except Exception as e:
        print(f"Erro atualizar_categoria: {e}")
        return False

def excluir_categoria(categoria_id: str) -> bool:
    try:
        db.collection("categorias").document(categoria_id).delete()
        # Também pode remover atividades ligadas a essa categoria se desejado
        return True
    except Exception as e:
        print(f"Erro excluir_categoria: {e}")
        return False

def atualizar_atividade(atividade_id: str, dados: Dict[str, Any]) -> bool:
    try:
        dados_limpos = {k: v for k, v in dados.items() if k not in ["id"]}
        dados_limpos["atualizado_em"] = firestore.SERVER_TIMESTAMP
        db.collection("atividades_cadastradas").document(atividade_id).set(dados_limpos, merge=True)
        return True
    except Exception as e:
        print(f"Erro atualizar_atividade: {e}")
        return False

def excluir_atividade(atividade_id: str) -> bool:
    try:
        db.collection("atividades_cadastradas").document(atividade_id).delete()
        return True
    except Exception as e:
        print(f"Erro excluir_atividade: {e}")
        return False

# =====================================================================
# 6. AGENDAMENTOS E EVENTOS DE CALENDÁRIO
# =====================================================================

def listar_agendamentos() -> List[Dict[str, Any]]:
    try:
        docs = db.collection("agendamentos").stream()
        agendamentos = []
        for doc in docs:
            d = doc.to_dict()
            d["id"] = doc.id
            agendamentos.append(d)
        agendamentos.sort(key=lambda x: (x.get("data", ""), x.get("hora_inicio", "")))
        return agendamentos
    except Exception as e:
        print(f"Erro listar_agendamentos: {e}")
        return []

def cadastrar_agendamento(dados: Dict[str, Any]) -> str:
    dados_limpos = {k: v for k, v in dados.items() if k not in ["id"]}
    dados_limpos["criado_em"] = firestore.SERVER_TIMESTAMP
    if "concluido" not in dados_limpos:
        dados_limpos["concluido"] = False
    
    # Se foi passado um id específico nos dados
    custom_id = dados.get("id")
    if custom_id:
        db.collection("agendamentos").document(custom_id).set(dados_limpos)
        return custom_id
    else:
        _, doc_ref = db.collection("agendamentos").add(dados_limpos)
        return doc_ref.id

def atualizar_agendamento(agendamento_id: str, dados: Dict[str, Any]) -> bool:
    try:
        dados_limpos = {k: v for k, v in dados.items() if k not in ["id"]}
        dados_limpos["atualizado_em"] = firestore.SERVER_TIMESTAMP
        db.collection("agendamentos").document(agendamento_id).set(dados_limpos, merge=True)
        return True
    except Exception as e:
        print(f"Erro atualizar_agendamento: {e}")
        return False

def excluir_agendamento(agendamento_id: str) -> bool:
    try:
        db.collection("agendamentos").document(agendamento_id).delete()
        return True
    except Exception as e:
        print(f"Erro excluir_agendamento: {e}")
        return False

# =====================================================================
# 7. HISTÓRICO DE ATIVIDADES & LANÇAMENTOS RÁPIDOS
# =====================================================================

def listar_historico_atividades() -> List[Dict[str, Any]]:
    try:
        docs = db.collection("historico_atividades").stream()
        historico = []
        for doc in docs:
            d = doc.to_dict()
            d["id"] = doc.id
            historico.append(d)
        historico.sort(key=lambda x: str(x.get("data_registro", "")), reverse=True)
        return historico
    except Exception as e:
        print(f"Erro listar_historico_atividades: {e}")
        return []

def cadastrar_historico_atividade(dados: Dict[str, Any]) -> str:
    categoria_id = dados.get("categoria_id")
    atividade_nome = dados.get("atividade_nome")
    valor = float(dados.get("valor", 0))

    cat = obter_categoria(categoria_id) or buscar_categoria_por_nome(categoria_id)
    if not cat:
        raise ValueError("Categoria não encontrada")

    agora = datetime.now()
    ano = int(dados.get("ano") or agora.year)
    mes = int(dados.get("mes") or agora.month)
    unidade = cat.get("unidade_padrao", "un")
    pontos_unit = float(cat.get("pontos_por_unidade", 1.0))
    pontos_gerados = round(valor * pontos_unit, 2)
    data_reg = agora.isoformat()

    doc_data = {
        "categoria_id": cat["id"],
        "categoria_nome": cat.get("nome"),
        "atividade_nome": atividade_nome,
        "valor": valor,
        "unidade": unidade,
        "pontos_gerados": pontos_gerados,
        "data_registro": data_reg,
        "ano": ano,
        "mes": mes
    }

    _, doc_ref = db.collection("historico_atividades").add(doc_data)

    # Atualiza o registro mensal correspondente
    id_registro = f"reg_{ano}_{mes:02d}_{cat['id']}"
    doc_reg_ref = db.collection("registros_mensais").document(id_registro)
    doc_reg = doc_reg_ref.get()

    if doc_reg.exists:
        reg_dados = doc_reg.to_dict()
        breakdown = reg_dados.get("atividades_breakdown", {})
        breakdown[atividade_nome] = round(breakdown.get(atividade_nome, 0) + valor, 2)
        novo_total = round(reg_dados.get("valor_total", 0) + valor, 2)
        doc_reg_ref.update({
            "valor_total": novo_total,
            "atividades_breakdown": breakdown,
            "atualizado_em": firestore.SERVER_TIMESTAMP
        })
    else:
        doc_reg_ref.set({
            "ano": ano,
            "mes": mes,
            "categoria_id": cat["id"],
            "categoria_nome": cat.get("nome"),
            "pilar_id": cat.get("pilar_id", "pilar_atividade_fisica"),
            "valor_total": valor,
            "unidade": unidade,
            "atividades_breakdown": {atividade_nome: valor},
            "atualizado_em": firestore.SERVER_TIMESTAMP
        })

    return doc_ref.id

def atualizar_historico_atividade(historico_id: str, dados: Dict[str, Any]) -> bool:
    try:
        doc_ref = db.collection("historico_atividades").document(historico_id)
        doc = doc_ref.get()
        if not doc.exists:
            return False

        old = doc.to_dict()
        novo_valor = dados.get("valor")
        if novo_valor is not None:
            novo_valor = float(novo_valor)
            antigo_valor = float(old.get("valor", old.get("valor_unidade", 0)))
            diff = novo_valor - antigo_valor
            ano = int(old.get("ano", datetime.now().year))
            mes = int(old.get("mes", datetime.now().month))
            cat_id = old.get("categoria_id")
            ativ_nome = old.get("atividade_nome")

            # Atualiza registros mensais com a diferença
            id_registro = f"reg_{ano}_{mes:02d}_{cat_id}"
            reg_ref = db.collection("registros_mensais").document(id_registro)
            reg_doc = reg_ref.get()
            if reg_doc.exists:
                reg_dados = reg_doc.to_dict()
                breakdown = reg_dados.get("atividades_breakdown", {})
                breakdown[ativ_nome] = max(0.0, round(breakdown.get(ativ_nome, 0) + diff, 2))
                new_total = max(0.0, round(reg_dados.get("valor_total", 0) + diff, 2))
                reg_ref.update({
                    "valor_total": new_total,
                    "atividades_breakdown": breakdown,
                    "atualizado_em": firestore.SERVER_TIMESTAMP
                })

            cat = obter_categoria(cat_id)
            pontos_unit = float(cat.get("pontos_por_unidade", 1.0)) if cat else 1.0
            novos_pontos = round(novo_valor * pontos_unit, 2)
            doc_ref.update({
                "valor": novo_valor,
                "pontos_gerados": novos_pontos,
                "atualizado_em": firestore.SERVER_TIMESTAMP
            })
            return True
        return False
    except Exception as e:
        print(f"Erro atualizar_historico_atividade: {e}")
        return False

def excluir_historico_atividade(historico_id: str) -> bool:
    try:
        doc_ref = db.collection("historico_atividades").document(historico_id)
        doc = doc_ref.get()
        if doc.exists:
            old = doc.to_dict()
            valor_removido = float(old.get("valor", old.get("valor_unidade", 0)))
            ano = int(old.get("ano", datetime.now().year))
            mes = int(old.get("mes", datetime.now().month))
            cat_id = old.get("categoria_id")
            ativ_nome = old.get("atividade_nome")

            # Deduz de registros mensais
            id_registro = f"reg_{ano}_{mes:02d}_{cat_id}"
            reg_ref = db.collection("registros_mensais").document(id_registro)
            reg_doc = reg_ref.get()
            if reg_doc.exists:
                reg_dados = reg_doc.to_dict()
                breakdown = reg_dados.get("atividades_breakdown", {})
                breakdown[ativ_nome] = max(0.0, round(breakdown.get(ativ_nome, 0) - valor_removido, 2))
                new_total = max(0.0, round(reg_dados.get("valor_total", 0) - valor_removido, 2))
                reg_ref.update({
                    "valor_total": new_total,
                    "atividades_breakdown": breakdown,
                    "atualizado_em": firestore.SERVER_TIMESTAMP
                })

            doc_ref.delete()
            return True
        return False
    except Exception as e:
        print(f"Erro excluir_historico_atividade: {e}")
        return False


