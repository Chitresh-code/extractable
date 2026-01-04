"""Initial migration: create users and extractions tables

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-04 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('is_verified', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_id', 'users', ['id'], unique=False)
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # Create extractions table
    op.create_table(
        'extractions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(), server_default='pending', nullable=True),
        sa.Column('input_type', sa.String(), nullable=True),
        sa.Column('input_filename', sa.String(), nullable=True),
        sa.Column('columns_requested', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('multiple_tables', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('output_format', sa.String(), server_default='json', nullable=True),
        sa.Column('output_file_path', sa.String(), nullable=True),
        sa.Column('llm_extraction_output', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('llm_validation_output', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('llm_final_output', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('table_data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_extractions_id', 'extractions', ['id'], unique=False)
    op.create_index('ix_extractions_user_id', 'extractions', ['user_id'], unique=False)
    op.create_index('ix_extractions_status', 'extractions', ['status'], unique=False)
    op.create_index('ix_extractions_created_at', 'extractions', ['created_at'], unique=False)


def downgrade() -> None:
    # Drop extractions table first (due to foreign key)
    op.drop_index('ix_extractions_created_at', table_name='extractions')
    op.drop_index('ix_extractions_status', table_name='extractions')
    op.drop_index('ix_extractions_user_id', table_name='extractions')
    op.drop_index('ix_extractions_id', table_name='extractions')
    op.drop_table('extractions')

    # Drop users table
    op.drop_index('ix_users_email', table_name='users')
    op.drop_index('ix_users_id', table_name='users')
    op.drop_table('users')

