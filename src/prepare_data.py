# src/prepare_data.py
import pandas as pd
import numpy as np

def findMissingValueCols(df, threshold=0.5):
    total_rows = len(df)
    return [col for col in df.columns if df[col].isna().sum() > total_rows * threshold]

def main():
    file_path = "data/loan.csv"
    out_path = "data/loans_clean.parquet"

    df = pd.read_csv(file_path)

    # Drop high-missing
    cols_to_drop = findMissingValueCols(df, threshold=0.5)
    df = df.drop(columns=cols_to_drop)

    # Drop high-cardinality / useless
    high_cardinality_or_text = [
        "emp_title","title","zip_code","url","desc","member_id","id",
        "num_policy_code","earliest_cr_line","issue_d"
    ]
    df = df.drop(columns=high_cardinality_or_text, errors="ignore")

    # Drop leakage
    leakage_columns = [
        "recoveries","collection_recovery_fee","last_pymnt_d","last_pymnt_amnt",
        "total_pymnt","total_rec_prncp","total_rec_int","out_prncp","out_prncp_inv",
        "total_pymnt_inv","total_rec_late_fee","next_pymnt_d","last_credit_pull_d"
    ]
    df = df.drop(columns=leakage_columns, errors="ignore")

    # Keep final outcomes
    df = df[df["loan_status"].isin(["Fully Paid", "Charged Off"])]

    # Target
    df["target"] = df["loan_status"].map({"Fully Paid": 0, "Charged Off": 1})

    # Log income (guard)
    if "annual_inc" in df.columns:
        df["log_income"] = np.log1p(df["annual_inc"])

    df.to_parquet(out_path, index=False)
    print("✅ Saved:", out_path)
    print("Final shape:", df.shape)

if __name__ == "__main__":
    main()