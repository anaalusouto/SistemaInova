"""Fronteira Inova → ChatKit. Nenhuma credencial de banco é usada aqui."""
import base64
import hashlib
import hmac
import json
import time

OPERATIONS = {"threads.create", "threads.add_user_message", "threads.get_by_id", "threads.list", "items.list"}


def verify_identity(headers, path: str, body: bytes, secret: str) -> dict:
    if len(secret) < 32:
        raise ValueError("unconfigured")
    timestamp = headers.get("x-inova-timestamp", "")
    identity = headers.get("x-inova-identity", "")
    if abs(time.time() - int(timestamp)) > 30 or len(identity) > 512:
        raise ValueError("expired")
    signed = timestamp.encode() + b"\n" + identity.encode() + b"\n" + path.encode() + b"\n" + body
    signature = hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, headers.get("x-inova-signature", "")):
        raise ValueError("unauthorized")
    value = json.loads(base64.urlsafe_b64decode(identity + "=" * (-len(identity) % 4)))
    if not isinstance(value.get("user"), str) or len(value["user"]) != 64 or value.get("role") not in {"admin", "estagiario", "visualizador"}:
        raise ValueError("unauthorized")
    return value


def safe_context(raw, knowledge: dict) -> dict:
    raw = raw if isinstance(raw, dict) else {}
    screen = raw.get("tela")
    result = {"tela": screen if isinstance(screen, str) and screen in knowledge["telas"] else "overview"}
    form = raw.get("formulario")
    if isinstance(form, str) and form in knowledge["formularios"]:
        result["formulario"] = form
        field = raw.get("campo")
        if isinstance(field, str) and field in knowledge["formularios"][form]["campos"]:
            result["campo"] = field
    return result


def validate_request(payload: dict) -> None:
    """Ferramentas, ações, anexos, modelos e metadados livres ficam bloqueados."""
    if payload.get("type") not in OPERATIONS:
        raise ValueError("unsupported operation")
    params = payload.get("params", {})
    if payload["type"] in {"threads.create", "threads.add_user_message"}:
        entry = params.get("input", {})
        content = entry.get("content", [])
        if len(content) != 1 or content[0].get("type") != "input_text" or not isinstance(content[0].get("text"), str) or not 1 <= len(content[0]["text"].strip()) <= 4000:
            raise ValueError("invalid text")
        if entry.get("attachments") or entry.get("quoted_text") or entry.get("inference_options"):
            raise ValueError("unsupported input")


def authorize_tool(_identity: dict, _tool: str) -> None:
    """Ponto de extensão futuro: revalidar sessão e escopo no Inova antes de cada ação.

    O serviço não tem banco/credenciais do Inova. Nenhum papel habilita ferramentas na V1.
    """
    raise PermissionError("Ferramentas indisponíveis nesta versão de orientação.")
