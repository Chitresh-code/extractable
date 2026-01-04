"""remove_output_file_path_column

Revision ID: 003_remove_output_file_path
Revises: 002_add_complexity_column
Create Date: 2026-01-04 16:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_remove_output_file_path'
down_revision = '002_add_complexity_column'
branch_labels = None
depends_on = None


def upgrade():
    # Remove output_file_path column as we no longer store files
    op.drop_column('extractions', 'output_file_path')


def downgrade():
    # Add back output_file_path column if needed
    op.add_column('extractions', sa.Column('output_file_path', sa.String(), nullable=True))

