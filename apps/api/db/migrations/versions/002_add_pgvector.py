"""Add pgvector support migration."""
from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


revision = "002_add_pgvector"
down_revision = "001_init_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.alter_column(
        "embeddings",
        "vector",
        existing_type=sa.Text(),
        type_=Vector(384),
        postgresql_using="vector::vector",
    )
    op.create_index(
        "ix_embeddings_vector_ivfflat",
        "embeddings",
        ["vector"],
        postgresql_using="ivfflat",
        postgresql_ops={"vector": "vector_cosine_ops"},
        postgresql_with={"lists": 100},
    )


def downgrade() -> None:
    op.drop_index("ix_embeddings_vector_ivfflat", table_name="embeddings")
    op.alter_column(
        "embeddings",
        "vector",
        existing_type=Vector(384),
        type_=sa.Text(),
        postgresql_using="vector::text",
    )
