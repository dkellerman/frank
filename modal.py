import modal
from fastapi.staticfiles import StaticFiles
from main import app as web_app


image = (
    modal.Image.debian_slim()
    .pip_install_from_pyproject("pyproject.toml")
    .pip_install("websockets")
    .add_local_file(".env", "/root/.env", copy=True)
    .add_local_file("main.py", "/root/main.py", copy=True)
    .add_local_dir("client/dist", "/root/client/dist", copy=True)
    .add_local_python_source("frank", copy=True)
)

app = modal.App("frank")


@app.function(image=image)
@modal.asgi_app()
def serve():
    web_app.mount(
        "/", StaticFiles(directory="/root/client/dist", html=True), name="static"
    )
    return web_app
