FROM python:3.13-slim AS builder
WORKDIR /ai

RUN python -m venv /opt/venv
COPY requirements.txt ./
RUN /opt/venv/bin/pip install --no-cache-dir -r requirements.txt


FROM python:3.13-slim AS runner
WORKDIR /ai

RUN adduser --disabled-password worker
USER worker

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY worker.py .

ENV PYTHONUNBUFFERED=1

CMD ["python3", "worker.py"]
