"""Add complexity column to extractions table

Revision ID: 002_add_complexity
Revises: 001_initial
Create Date: 2026-01-04 12:40:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_add_complexity'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add complexity column to extractions table
    op.add_column('extractions', sa.Column('complexity', sa.String(), server_default='regular', nullable=True))


def downgrade() -> None:
    # Remove complexity column
    op.drop_column('extractions', 'complexity')

