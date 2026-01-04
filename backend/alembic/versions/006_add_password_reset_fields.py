"""Add password reset token fields to users table

Revision ID: 006_add_password_reset_fields
Revises: 005_add_user_name_fields
Create Date: 2026-01-04 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '006_add_password_reset_fields'
down_revision = '005_add_user_name_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add password reset token and expiration fields
    op.add_column('users', sa.Column('password_reset_token', sa.String(), nullable=True))
    op.add_column('users', sa.Column('password_reset_expires', sa.DateTime(timezone=True), nullable=True))
    # Create index on password_reset_token for faster lookups
    op.create_index(op.f('ix_users_password_reset_token'), 'users', ['password_reset_token'], unique=False)


def downgrade() -> None:
    # Remove index and columns
    op.drop_index(op.f('ix_users_password_reset_token'), table_name='users')
    op.drop_column('users', 'password_reset_expires')
    op.drop_column('users', 'password_reset_token')

