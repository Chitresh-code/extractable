"""Add first_name and last_name columns to users table

Revision ID: 005_add_user_name_fields
Revises: 004_add_priority_column
Create Date: 2026-01-04 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005_add_user_name_fields'
down_revision = '004_add_priority_column'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add first_name and last_name columns to users table
    op.add_column('users', sa.Column('first_name', sa.String(), nullable=True))
    op.add_column('users', sa.Column('last_name', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove first_name and last_name columns
    op.drop_column('users', 'last_name')
    op.drop_column('users', 'first_name')

