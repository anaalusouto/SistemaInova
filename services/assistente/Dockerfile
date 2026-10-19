# Execute o build na raiz do repositório:
# docker build -f services/assistente/Dockerfile -t inova-assistente .
FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 INOVA_ASSISTANT_DB=/data/conversations.sqlite3
WORKDIR /app
COPY services/assistente/requirements.lock.txt /app/services/assistente/requirements.lock.txt
RUN pip install --no-cache-dir -r /app/services/assistente/requirements.lock.txt \
    && useradd --create-home --uid 10001 inova \
    && mkdir /data && chown inova:inova /data
COPY services/assistente/app.py services/assistente/security.py services/assistente/store.py services/assistente/instructions.txt /app/services/assistente/
COPY src/app/assistant/knowledge.json /app/src/app/assistant/knowledge.json
USER inova
EXPOSE 8091
# O host deve montar um volume persistente em /data, injetar segredos e fornecer TLS.
CMD ["python", "-m", "uvicorn", "app:app", "--app-dir", "services/assistente", "--host", "0.0.0.0", "--port", "8091", "--workers", "1"]
