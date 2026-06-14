from alembic import op
import sqlalchemy as sa

revision = "003_add_missing_columns"
down_revision = "002_add_pgvector"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column("concepts",
        sa.Column("summary", sa.Text(), nullable=True))
    op.alter_column("lectures", "raw_video_url",
        existing_type=sa.Text(), nullable=True)

def downgrade() -> None:
    op.drop_column("concepts", "summary")
    op.alter_column("lectures", "raw_video_url",
        existing_type=sa.Text(), nullable=False)
