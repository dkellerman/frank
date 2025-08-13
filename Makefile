build:
	cd client && VITE_APP_DEPLOY=modal npm run build

deploy: build
	fly deploy

dev:
	uv run main.py

devc:
	cd client && npm run dev

clai:
	uv run clai -a frank.agents:base_agent

lint:
	uv run ruff check --fix

pydantic-to-typescript:
	PYTHONPATH=. uv run pydantic2ts --module frank.schemas --output client/src/lib/pydantic-types.ts
