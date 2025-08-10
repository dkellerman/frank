build:
	cd client && VITE_APP_DEPLOY=modal npm run build

deploy: build
	uv run modal deploy modal_app.py

dev:
	uv run main.py

devc:
	cd client && npm run dev

clai:
	uv run clai -a frank.agents:default_agent

lint:
	uv run ruff check --fix

pydantic-to-typescript:
	PYTHONPATH=. uv run pydantic2ts --module frank.schemas --output client/src/lib/pydantic-types.ts
