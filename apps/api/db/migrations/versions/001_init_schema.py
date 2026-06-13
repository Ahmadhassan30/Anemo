"""Initial schema migration."""
from alembic import op
import sqlalchemy as sa


revision = "001_init_schema"
down_revision = None
branch_labels = None
depends_on = None


user_role_enum = sa.Enum("professor", "student", name="user_role")
lecture_status_enum = sa.Enum("pending", "processing", "completed", "failed", name="lecture_status")
render_status_enum = sa.Enum("pending", "rendering", "done", "failed", name="render_status")
agent_run_status_enum = sa.Enum("started", "success", "failed", "retrying", name="agent_run_status")


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.Text(), nullable=False),
        sa.Column("role", user_role_enum, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "lectures",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("professor_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("raw_video_url", sa.Text(), nullable=False),
        sa.Column("status", lecture_status_enum, nullable=False, server_default=sa.text("'pending'")),
        sa.Column("youtube_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["professor_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_lectures_professor_id", "lectures", ["professor_id"])
    op.create_index("ix_lectures_status", "lectures", ["status"])

    op.create_table(
        "enrollments",
        sa.Column("student_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("lecture_id", sa.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["student_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["lecture_id"], ["lectures.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("student_id", "lecture_id"),
    )
    op.create_index("ix_enrollments_student_id", "enrollments", ["student_id"])
    op.create_index("ix_enrollments_lecture_id", "enrollments", ["lecture_id"])

    op.create_table(
        "concepts",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("lecture_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("ts_start", sa.Float(), nullable=False),
        sa.Column("ts_end", sa.Float(), nullable=False),
        sa.Column("visual_type", sa.String(length=100), nullable=False),
        sa.Column("manim_code", sa.Text(), nullable=True),
        sa.Column("clip_url", sa.Text(), nullable=True),
        sa.Column("render_status", render_status_enum, nullable=False, server_default=sa.text("'pending'")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["lecture_id"], ["lectures.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_concepts_lecture_id", "concepts", ["lecture_id"])
    op.create_index("ix_concepts_render_status", "concepts", ["render_status"])

    op.create_table(
        "embeddings",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("lecture_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("concept_id", sa.UUID(as_uuid=True), nullable=True),
        sa.Column("chunk_text", sa.Text(), nullable=False),
        sa.Column("vector", sa.Text(), nullable=False),
        sa.Column("ts_start", sa.Float(), nullable=True),
        sa.Column("ts_end", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["lecture_id"], ["lectures.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["concept_id"], ["concepts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_embeddings_lecture_id", "embeddings", ["lecture_id"])
    op.create_index("ix_embeddings_concept_id", "embeddings", ["concept_id"])

    op.create_table(
        "quizzes",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("lecture_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("choices", sa.dialects.postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("answer", sa.String(length=255), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["lecture_id"], ["lectures.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_quizzes_lecture_id", "quizzes", ["lecture_id"])

    op.create_table(
        "agent_runs",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("lecture_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("agent_name", sa.String(length=255), nullable=False),
        sa.Column("status", agent_run_status_enum, nullable=False, server_default=sa.text("'started'")),
        sa.Column("attempt", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["lecture_id"], ["lectures.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_agent_runs_lecture_id", "agent_runs", ["lecture_id"])
    op.create_index("ix_agent_runs_status", "agent_runs", ["status"])


def downgrade() -> None:
    op.drop_index("ix_agent_runs_status", table_name="agent_runs")
    op.drop_index("ix_agent_runs_lecture_id", table_name="agent_runs")
    op.drop_table("agent_runs")

    op.drop_index("ix_quizzes_lecture_id", table_name="quizzes")
    op.drop_table("quizzes")

    op.drop_index("ix_embeddings_concept_id", table_name="embeddings")
    op.drop_index("ix_embeddings_lecture_id", table_name="embeddings")
    op.drop_table("embeddings")

    op.drop_index("ix_concepts_render_status", table_name="concepts")
    op.drop_index("ix_concepts_lecture_id", table_name="concepts")
    op.drop_table("concepts")

    op.drop_index("ix_enrollments_lecture_id", table_name="enrollments")
    op.drop_index("ix_enrollments_student_id", table_name="enrollments")
    op.drop_table("enrollments")

    op.drop_index("ix_lectures_status", table_name="lectures")
    op.drop_index("ix_lectures_professor_id", table_name="lectures")
    op.drop_table("lectures")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    agent_run_status_enum.drop(op.get_bind(), checkfirst=True)
    render_status_enum.drop(op.get_bind(), checkfirst=True)
    lecture_status_enum.drop(op.get_bind(), checkfirst=True)
    user_role_enum.drop(op.get_bind(), checkfirst=True)
