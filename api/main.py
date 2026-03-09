# api/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import numpy as np
import joblib

MODEL_PATH = "models/xgb_final.pkl"
REVIEW_THRESHOLD = 0.10   # manual verification / review queue
DECLINE_THRESHOLD = 0.70  # stricter decision threshold 

app = FastAPI(title="Credit Risk Scoring API", version="1.0")

# Load the trained pipeline once on startup
model = joblib.load(MODEL_PATH)

# Columns your model expects (from your training printout)
MODEL_COLUMNS = [
    'loan_amnt', 'funded_amnt', 'funded_amnt_inv', 'term', 'int_rate', 'installment', 'grade',
    'sub_grade', 'emp_length', 'home_ownership', 'annual_inc', 'verification_status', 'pymnt_plan',
    'purpose', 'addr_state', 'dti', 'delinq_2yrs', 'inq_last_6mths', 'open_acc', 'pub_rec',
    'revol_bal', 'revol_util', 'total_acc', 'initial_list_status', 'collections_12_mths_ex_med',
    'policy_code', 'application_type', 'acc_now_delinq', 'tot_coll_amt', 'tot_cur_bal',
    'total_rev_hi_lim', 'log_income', 'loan_to_income', 'utilization_flag'
]

# Input schema for requests to /predict
# Required: core fields (simple demo)
# Optional: everything else (imputed by pipeline)
class LoanApplication(BaseModel):
    # REQUIRED
    loan_amnt: float
    term: str
    int_rate: float
    grade: str
    annual_inc: float
    dti: float
    revol_util: float
    purpose: str
    home_ownership: str
    verification_status: str

    # OPTIONAL
    funded_amnt: Optional[float] = None
    funded_amnt_inv: Optional[float] = None
    installment: Optional[float] = None
    sub_grade: Optional[str] = None
    emp_length: Optional[str] = None
    pymnt_plan: Optional[str] = None
    addr_state: Optional[str] = None
    delinq_2yrs: Optional[float] = None
    inq_last_6mths: Optional[float] = None
    open_acc: Optional[float] = None
    pub_rec: Optional[float] = None
    revol_bal: Optional[float] = None
    total_acc: Optional[float] = None
    initial_list_status: Optional[str] = None
    collections_12_mths_ex_med: Optional[float] = None
    policy_code: Optional[float] = None
    application_type: Optional[str] = None
    acc_now_delinq: Optional[float] = None
    tot_coll_amt: Optional[float] = None
    tot_cur_bal: Optional[float] = None
    total_rev_hi_lim: Optional[float] = None

@app.get("/health")
def health():
    """
    Health check endpoint.
    """
    return {"status": "ok"}

@app.post("/predict")
def predict(applicant: LoanApplication):
    """
    Returns:
      - pd_default: predicted probability of default
      - decision_default: 1 if pd_default >= THRESHOLD else 0
    """
    data = applicant.model_dump()

    # Feature engineering must match training
    data["loan_to_income"] = data["loan_amnt"] / data["annual_inc"] if data["annual_inc"] else np.nan
    data["utilization_flag"] = 1 if (data["revol_util"] is not None and data["revol_util"] > 80) else 0
    data["log_income"] = np.log1p(data["annual_inc"]) if data["annual_inc"] else np.nan

    # Build exactly the columns your model expects; missing -> None (imputer handles it)
    row = {col: data.get(col, None) for col in MODEL_COLUMNS}
    X = pd.DataFrame([row])

    pd_default = float(model.predict_proba(X)[:, 1][0])
    decision_default = int(pd_default >= THRESHOLD)

    review_flag = int(pd_default >= REVIEW_THRESHOLD)
    decline_flag = int(pd_default >= DECLINE_THRESHOLD)

    return {
        "pd_default": round(pd_default, 6),
        "review_threshold": REVIEW_THRESHOLD,
        "review_flag": review_flag,
        "decline_threshold": DECLINE_THRESHOLD,
        "decline_flag": decline_flag
    }

@app.get("/")
def root():
    return {
        "message": "Credit Risk API is running. See /docs for Swagger UI.",
        "health": "/health",
        "predict": "/predict",
        "thresholds": {
            "review_threshold": REVIEW_THRESHOLD,
            "decline_threshold": DECLINE_THRESHOLD
        }    
    }