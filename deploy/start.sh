#!/bin/sh
set -e

uv run alembic upgrade head
uv run uvicorn main:app --host 0.0.0.0 --port 8000 &

python -c "
import socket, time
while True:
    try:
        socket.create_connection(('127.0.0.1', 8000), timeout=1).close()
        break
    except OSError:
        time.sleep(0.2)
"

exec nginx -g 'daemon off;'
