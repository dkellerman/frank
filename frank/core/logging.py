import logfire
from fastapi import FastAPI
from frank.core.config import settings


def configure_logging(app: FastAPI) -> None:
    logfire.configure(
        send_to_logfire="if-token-present",
        token=settings.LOGFIRE_TOKEN,
        environment=settings.APP_ENV,
        service_name="server",
        scrubbing=False,
    )
    logfire.instrument_fastapi(app)
