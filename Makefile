build:
	cd client && npm run build

deploy: build
	uv run modal deploy server.py

dev:
	uv run server.py

clai-rewrite:
	uv run clai -a frank.agent:rewrite_agent

clai-answer:
	uv run clai -a frank.agent:answer_agent

clai-rewrite-answer:
	uv run clai -a frank.agent:rewrite_answer_agent

lint:
	uv run ruff check --fix

dev-all:
	cd client && npm run dev:all

pydantic-to-typescript:
	PYTHONPATH=. uv run pydantic2ts --module frank.models --output client/src/lib/pydantic-types.ts
