build:
	cd client && npm run build

deploy: build
	uv run modal deploy modal.py

dev:
	uv run main.py

clai:
	uv run clai -a frank.agents:agent

lint:
	uv run ruff check --fix

pydantic-to-typescript:
	PYTHONPATH=. uv run pydantic2ts --module frank.schemas --output client/src/lib/pydantic-types.ts
