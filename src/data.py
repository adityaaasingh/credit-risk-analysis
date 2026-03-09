#src/data.py
import pandas as pd

def load_data(path: str = "data/loans_clean.parquet") -> pd.DataFrame:
    """Load the cleaned dataset used for modeling."""
    return pd.read_parquet(path)