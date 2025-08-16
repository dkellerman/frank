build:
	cd client && npm run build

deploy: build
	fly deploy --config deploy/fly.toml

dev:
	uv run main.py

devc:
	cd client && npm run dev

clai:
	uv run clai -a frank.agents:base_agent

lint:
	uv run ruff check --fix

pydantic2ts:
	PYTHONPATH=. uv run pydantic2ts --module frank.schemas --output client/src/lib/pydantic-types.ts
