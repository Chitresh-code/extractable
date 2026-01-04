"""Add priority column to extractions table

Revision ID: 004_add_priority_column
Revises: 003_remove_output_file_path
Create Date: 2026-01-04 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004_add_priority_column'
down_revision = '003_remove_output_file_path'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add priority column to extractions table
    op.add_column('extractions', sa.Column('priority', sa.String(), server_default='medium', nullable=False))


def downgrade() -> None:
    # Remove priority column
    op.drop_column('extractions', 'priority')

