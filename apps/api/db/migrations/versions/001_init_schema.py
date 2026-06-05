"""Initial schema migration."""
from alembic import op
import sqlalchemy as sa

revision = "001_init_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # TODO: create core tables
    pass


def downgrade() -> None:
    # TODO: drop core tables
    pass
