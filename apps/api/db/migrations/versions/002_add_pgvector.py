"""Add pgvector support migration."""
from alembic import op
import sqlalchemy as sa

revision = "002_add_pgvector"
down_revision = "001_init_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # TODO: enable pgvector extension and embeddings table
    pass


def downgrade() -> None:
    # TODO: remove pgvector extension changes
    pass
