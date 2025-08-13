FROM ghcr.io/astral-sh/uv:python3.13-bookworm

WORKDIR /app

COPY pyproject.toml uv.lock* ./
RUN uv sync --frozen --no-dev --no-install-project

COPY . .
RUN uv sync --frozen --no-dev
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*
COPY nginx.conf /etc/nginx/nginx.conf
COPY client/dist/ /app/client/
EXPOSE 8000

CMD sh -c 'uv run uvicorn main:app --host 0.0.0.0 --port 9000 & exec nginx -g "daemon off;"'

