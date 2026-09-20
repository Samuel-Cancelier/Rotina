from flask import jsonify, request
from flask_cors import CORS
import database
import datetime

def register_endpoints(app):
    CORS(app)

    # -------------------------------------------------------------
    # PILARES
    # -------------------------------------------------------------
    @app.route("/api/pilares", methods=["GET"])
    def api_pilares():
        return jsonify(database.listar_pilares()), 200

    @app.route("/api/pilares/<id>", methods=["PUT"])
    def api_atualizar_pilar(id):
        dados = request.get_json() or {}
        sucesso = database.atualizar_pilar(id, dados)
        if sucesso:
            return jsonify({"status": "sucesso", "pilar_id": id}), 200
        return jsonify({"erro": "Falha ao atualizar pilar"}), 400

    # -------------------------------------------------------------
    # CATEGORIAS
    # -------------------------------------------------------------
    @app.route("/api/categorias", methods=["GET"])
    def api_categorias():
        return jsonify(database.listar_categorias_dict()), 200

    @app.route("/api/categorias", methods=["POST"])
    def api_criar_categoria():
        dados = request.get_json() or {}
        nome = dados.get("nome", "").strip()
        unidade = dados.get("unidade_padrao", "un")
        pilar_id = dados.get("pilar_id", "pilar_atividade_fisica")
        pontos_por_unidade = float(dados.get("pontos_por_unidade", 1.0))
        meta_mensal = float(dados.get("meta_mensal", 0.0))
        cor = dados.get("cor", "#3b82f6")

        if not nome:
            return jsonify({"erro": "Nome é obrigatório"}), 400

        cat_id = database.cadastrar_categoria(
            nome=nome,
            unidade=unidade,
            pilar_id=pilar_id,
            pontos_por_unidade=pontos_por_unidade,
            meta_mensal=meta_mensal,
            cor=cor
        )
        return jsonify({"status": "criado", "id": cat_id}), 201

    @app.route("/api/categorias/<id>", methods=["PUT"])
    def api_atualizar_categoria(id):
        dados = request.get_json() or {}
        sucesso = database.atualizar_categoria(id, dados)
        if sucesso:
            return jsonify({"status": "sucesso", "categoria_id": id}), 200
        return jsonify({"erro": "Falha ao atualizar categoria"}), 400

    @app.route("/api/categorias/<id>", methods=["DELETE"])
    def api_excluir_categoria(id):
        sucesso = database.excluir_categoria(id)
        if sucesso:
            return jsonify({"status": "excluido", "categoria_id": id}), 200
        return jsonify({"erro": "Falha ao excluir categoria"}), 400

    # -------------------------------------------------------------
    # ATIVIDADES
    # -------------------------------------------------------------
    @app.route("/api/atividades", methods=["GET"])
    def api_atividades():
        return jsonify(database.listar_atividades_dict()), 200

    @app.route("/api/atividades", methods=["POST"])
    def api_criar_atividade():
        dados = request.get_json() or {}
        nome = dados.get("nome", "").strip()
        categoria_id = dados.get("categoria_id", "")
        pilar_id = dados.get("pilar_id")
        recorrente = bool(dados.get("recorrente", True))
        unidade = dados.get("unidade")
        afeta_meta = bool(dados.get("afeta_meta", True))

        if not nome or not categoria_id:
            return jsonify({"erro": "Nome e categoria_id são obrigatórios"}), 400

        try:
            ativ_id = database.cadastrar_atividade(
                nome=nome,
                categoria_id=categoria_id,
                pilar_id=pilar_id,
                recorrente=recorrente,
                unidade=unidade,
                afeta_meta=afeta_meta
            )
            return jsonify({"status": "criado", "id": ativ_id}), 201
        except Exception as e:
            return jsonify({"erro": str(e)}), 400

    @app.route("/api/atividades/<id>", methods=["PUT"])
    def api_atualizar_atividade(id):
        dados = request.get_json() or {}
        sucesso = database.atualizar_atividade(id, dados)
        if sucesso:
            return jsonify({"status": "sucesso", "atividade_id": id}), 200
        return jsonify({"erro": "Falha ao atualizar atividade"}), 400

    @app.route("/api/atividades/<id>", methods=["DELETE"])
    def api_excluir_atividade(id):
        sucesso = database.excluir_atividade(id)
        if sucesso:
            return jsonify({"status": "excluido", "atividade_id": id}), 200
        return jsonify({"erro": "Falha ao excluir atividade"}), 400

    # -------------------------------------------------------------
    # REGISTROS MENSAIS
    # -------------------------------------------------------------
    @app.route("/api/registros_mensais", methods=["GET"])
    def api_registros():
        ano = request.args.get("ano", type=int)
        mes = request.args.get("mes", type=int)
        return jsonify(database.listar_registros_mensais(ano=ano, mes=mes)), 200

    # -------------------------------------------------------------
    # AGENDAMENTOS E EVENTOS DE CALENDÁRIO
    # -------------------------------------------------------------
    @app.route("/api/agendamentos", methods=["GET"])
    def api_agendamentos():
        return jsonify(database.listar_agendamentos()), 200

    @app.route("/api/agendamentos", methods=["POST"])
    def api_criar_agendamento():
        dados = request.get_json() or {}
        ag_id = database.cadastrar_agendamento(dados)
        return jsonify({"status": "criado", "id": ag_id}), 201

    @app.route("/api/agendamentos/<id>", methods=["PUT"])
    def api_atualizar_agendamento(id):
        dados = request.get_json() or {}
        sucesso = database.atualizar_agendamento(id, dados)
        if sucesso:
            return jsonify({"status": "sucesso", "agendamento_id": id}), 200
        return jsonify({"erro": "Falha ao atualizar agendamento"}), 400

    @app.route("/api/agendamentos/<id>", methods=["DELETE"])
    def api_excluir_agendamento(id):
        sucesso = database.excluir_agendamento(id)
        if sucesso:
            return jsonify({"status": "excluido", "agendamento_id": id}), 200
        return jsonify({"erro": "Falha ao excluir agendamento"}), 400

    # -------------------------------------------------------------
    # HISTÓRICO DE ATIVIDADES E LANÇAMENTOS RÁPIDOS
    # -------------------------------------------------------------
    @app.route("/api/historico_atividades", methods=["GET"])
    def api_historico():
        return jsonify(database.listar_historico_atividades()), 200

    @app.route("/api/historico_atividades", methods=["POST"])
    def api_criar_historico():
        dados = request.get_json() or {}
        categoria_id = dados.get("categoria_id")
        atividade_nome = dados.get("atividade_nome")
        valor = dados.get("valor")

        if not categoria_id or not atividade_nome or valor is None:
            return jsonify({"erro": "categoria_id, atividade_nome e valor são obrigatórios"}), 400

        try:
            hist_id = database.cadastrar_historico_atividade(dados)
            return jsonify({"status": "criado", "id": hist_id}), 201
        except Exception as e:
            return jsonify({"erro": str(e)}), 400

    @app.route("/api/historico_atividades/<id>", methods=["PUT"])
    def api_atualizar_historico(id):
        dados = request.get_json() or {}
        sucesso = database.atualizar_historico_atividade(id, dados)
        if sucesso:
            return jsonify({"status": "sucesso", "historico_id": id}), 200
        return jsonify({"erro": "Falha ao atualizar histórico"}), 400

    @app.route("/api/historico_atividades/<id>", methods=["DELETE"])
    def api_excluir_historico(id):
        sucesso = database.excluir_historico_atividade(id)
        if sucesso:
            return jsonify({"status": "excluido", "historico_id": id}), 200
        return jsonify({"erro": "Falha ao excluir histórico"}), 400

