"""
Polars-based format converter.
Converts table data to CSV, Excel, and JSON formats.
"""

import polars as pl
from typing import Dict, Any, List
from io import BytesIO
from app.models.enums import OutputFormat


def convert_to_dataframe(table_data: Dict[str, Any]) -> pl.DataFrame:
    """
    Convert table data dictionary to Polars DataFrame.
    
    Args:
        table_data: Table data dictionary with "tables" array
        
    Returns:
        Polars DataFrame
        
    Raises:
        ValueError: If table data is invalid
    """
    if "tables" not in table_data or not table_data["tables"]:
        raise ValueError("No tables found in data")
    
    # Get first table (or combine all if multiple)
    first_table = table_data["tables"][0]
    
    if "rows" not in first_table or not first_table["rows"]:
        raise ValueError("No rows found in table")
    
    # Convert to DataFrame
    df = pl.DataFrame(first_table["rows"])
    
    return df


def convert_to_csv(table_data: Dict[str, Any]) -> bytes:
    """
    Convert table data to CSV format.
    
    Args:
        table_data: Table data dictionary
        
    Returns:
        CSV file bytes
    """
    df = convert_to_dataframe(table_data)
    csv_bytes = df.write_csv().encode('utf-8')
    return csv_bytes


def convert_to_json(table_data: Dict[str, Any]) -> bytes:
    """
    Convert table data to JSON format.
    
    Args:
        table_data: Table data dictionary
        
    Returns:
        JSON file bytes
    """
    import json
    json_bytes = json.dumps(table_data, indent=2).encode('utf-8')
    return json_bytes


def convert_to_excel(table_data: Dict[str, Any]) -> bytes:
    """
    Convert table data to Excel format.
    
    Args:
        table_data: Table data dictionary
        
    Returns:
        Excel file bytes
    """
    df = convert_to_dataframe(table_data)
    
    # Use polars write_excel if available, otherwise use openpyxl
    try:
        excel_bytes = BytesIO()
        df.write_excel(excel_bytes)
        excel_bytes.seek(0)
        return excel_bytes.read()
    except Exception:
        # Fallback: convert to CSV and suggest using openpyxl
        raise NotImplementedError(
            "Excel export requires polars-xlsx or openpyxl. "
            "Install with: pip install polars-xlsx"
        )


def convert_table_data(
    table_data: Dict[str, Any],
    output_format: str
) -> bytes:
    """
    Convert table data to requested format.
    
    Args:
        table_data: Table data dictionary
        output_format: Desired output format (json, csv, excel)
        
    Returns:
        File bytes in requested format
        
    Raises:
        ValueError: If format is not supported
    """
    if output_format == OutputFormat.JSON.value:
        return convert_to_json(table_data)
    elif output_format == OutputFormat.CSV.value:
        return convert_to_csv(table_data)
    elif output_format == OutputFormat.EXCEL.value:
        return convert_to_excel(table_data)
    else:
        raise ValueError(f"Unsupported output format: {output_format}")

