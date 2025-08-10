# AWS Deployment (EC2 + S3/CloudFront) with Cloudflare

This guide deploys:
- FastAPI backend on a free-tier EC2 instance served directly by `uvicorn` on localhost (no nginx)
- React client built with Vite to S3, served via CloudFront
- Cloudflare proxy in front of both, on a single domain, using a Worker for path routing

## Prerequisites
- AWS account with programmatic credentials
- Domain managed in Cloudflare
- An EC2 instance (Ubuntu 22.04+ recommended) reachable via SSH
- A GitHub repository with Actions enabled

## Environment variables (single source: `.env` locally)
Create `.env` at the project root. Only set base required variables:

```
APP_ENV=production
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Do not duplicate these elsewhere; the backend reads from `${EC2_APP_DIR}/.env` on the EC2 host.

## One-time AWS setup
1. S3 bucket for the SPA
   - Create an S3 bucket, e.g., `frank-web-prod`
   - Block public access ON (CloudFront will serve)

2. CloudFront distribution for the SPA
   - Origin: the S3 bucket above
   - Default root object: `index.html`
   - Behaviors: cache static assets aggressively; ensure `index.html` is not cached (the workflow sets headers).
   - SPA routing: add Custom Error Responses mapping 403 and 404 to `/index.html` with 200 response to support client-side routing.

3. EC2 instance for the backend
   - Ubuntu (t2.micro, free-tier) with a public IP
   - Open inbound: TCP 22 (SSH) and TCP 8000 (if you prefer direct Worker-to-port). Alternatively, run a local tunnel or set up firewall rules as needed.

## GitHub Secrets
Set these in your repo Settings → Secrets and variables → Actions:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION (e.g., us-east-1)
- S3_BUCKET (e.g., frank-web-prod)
- CLOUDFRONT_DISTRIBUTION_ID (optional; set to blank to skip invalidation)
- EC2_HOST (public IP or DNS of the instance)
- EC2_USER (e.g., ubuntu)
- EC2_APP_DIR (e.g., /opt/frank)
- EC2_SSH_KEY (paste contents of your private key for EC2)
- SERVICE_NAME (systemd unit name running uvicorn, e.g., `frank`)

The backend reads configuration from a single file on the EC2 host: `${EC2_APP_DIR}/.env`. Upload it once:

```
scp .env ${EC2_USER}@${EC2_HOST}:${EC2_APP_DIR}/.env
```

## How deployments work
- Client:
  - Build with Vite and upload to S3
  - Invalidate CloudFront for `index.html` and `/assets/*`
- Server:
  - Rsync `main.py`, `frank/`, `pyproject.toml`, and `.env` to EC2 under `EC2_APP_DIR`
  - Use `uv sync` on the host to install/update dependencies, then restart the systemd service running `uvicorn`

## Run a deployment
- Push to `main` or manually run the workflows:
  - Client: Deploy Client
  - Server: Deploy Server

## Cloudflare configuration (single domain for static + API/WS)
Use Cloudflare to serve everything on one hostname (e.g., `app.example.com`):

- DNS:
  - CNAME `app` → CloudFront distribution domain, Proxy status: Proxied
- Worker for path-based routing:
  - Create a Worker and add a Route `app.example.com/*`
  - Set the following script (edit `EC2_ORIGIN` and `CLOUDFRONT_ORIGIN`):

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const EC2_ORIGIN = 'http://<EC2_PUBLIC_IP>:8000'; // uvicorn serves /api and /ws
    const CLOUDFRONT_ORIGIN = 'https://<CLOUDFRONT_DOMAIN>'; // static SPA

    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/ws')) {
      // Proxy API and WebSocket to EC2
      const target = new URL(url.pathname + url.search, EC2_ORIGIN);
      const upgradeHeader = request.headers.get('Upgrade') || '';
      if (upgradeHeader.toLowerCase() === 'websocket') {
        return fetch(target, { headers: request.headers, method: request.method });
      }
      return fetch(target, { headers: request.headers, method: request.method, body: request.body });
    }

    // Otherwise go to CloudFront for SPA
    const target = new URL(url.pathname + url.search, CLOUDFRONT_ORIGIN);
    return fetch(target, { headers: request.headers, method: request.method });
  },
};
```

- SSL/TLS: Full (recommended). Cloudflare terminates TLS for users.

## Local testing
- `make dev` starts the FastAPI server at 127.0.0.1:8000
- `make devc` starts the client and proxies `/api` and `/ws` to the server

## Notes
- Python version: 3.13 (matches the project)
- The service listens on 127.0.0.1:8000 or 0.0.0.0:8000 depending on your systemd unit; Cloudflare Worker connects to the EC2 public IP and port 8000.
- The SPA is served from CloudFront/S3

## Troubleshooting
- Check systemd: `sudo systemctl status <SERVICE_NAME>` and `sudo journalctl -u <SERVICE_NAME> -e`
- Health: `curl http://127.0.0.1:8000/api/healthz` on the EC2 host