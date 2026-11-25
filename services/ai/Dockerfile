FROM python:3.13-slim
WORKDIR /ai

COPY worker.py .

ENV PYTHONUNBUFFERED=1

CMD ["python3", "worker.py"]
