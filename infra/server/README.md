EC2 setup script

- File: `infra/server/setup_ec2.sh`
- Installs: python3, venv, pip, nginx
- Creates: Python virtualenv in `${APP_DIR:-/opt/frank}/.venv`
- Systemd service: `frank.service` (configurable via SERVICE_NAME)
- Nginx reverse proxy for `/api` and `/ws` → uvicorn on 127.0.0.1:8000

Manual usage on a fresh host:

```
APP_DIR=/opt/frank bash infra/server/setup_ec2.sh
```

Ensure you place `.env`, `requirements.txt`, `main.py`, and the `frank/` package in `${APP_DIR}` before running the script.