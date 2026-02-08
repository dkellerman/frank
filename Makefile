build:
	cd client && npm run build

deploy: build
	fly deploy --config deploy/fly.toml

dev:
	uv run main.py

devc:
	cd client && npm run dev

devall:
	@echo "Shutting down existing dev servers..."
	@-kill -9 $$(lsof -ti:8000) 2>/dev/null; exit 0
	@-kill -9 $$(lsof -ti:5173) 2>/dev/null; exit 0
	@-pkill -f "honcho start" 2>/dev/null; exit 0
	@echo "Starting dev servers..."
	uv run honcho start -f Procfile.dev

clai:
	uv run clai -a frank.agents:base_agent

lint:
	uv run ruff check --fix

pydantic2ts:
	PYTHONPATH=. uv run pydantic2ts --module frank.schemas --output client/src/lib/pydantic-types.ts

db-migrate:
	uv run alembic upgrade head

db-update:
	@test -n "$(MSG)" || (echo "Usage: make db-migrate MSG=\"...\""; exit 1)
	uv run alembic revision --autogenerate -m "$(MSG)"
