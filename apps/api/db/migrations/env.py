"""Alembic environment configuration."""
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from models.base import Base

# TODO: configure Alembic logging
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# TODO: set target metadata for autogenerate
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    # TODO: implement offline migrations
    pass


def run_migrations_online() -> None:
    # TODO: implement online migrations
    pass
