# credit-risk-analysis

# Credit Risk Analysis + Deployed Scoring API

This project builds a credit risk model that predicts the **probability of loan default** and exposes the model via a **public FastAPI endpoint** (with Swagger docs). It demonstrates an end-to-end, production-style ML workflow: data preparation → modelling → evaluation → model saving → API inference → deployment.

## Live Demo (Public API)
- **Swagger UI:** https://credit-risk-analysis-iuyk.onrender.com/docs  
- **Health check:** https://credit-risk-analysis-iuyk.onrender.com/health  
- **Root:** https://credit-risk-analysis-iuyk.onrender.com/  
- **Predict endpoint:** `POST https://credit-risk-analysis-iuyk.onrender.com/predict`

---

## Problem
Given borrower + loan application features, predict whether a loan will **default (Charged Off)** vs **Fully Paid**.  
The deployed system returns:
- `pd_default` = predicted probability of default
- `review_flag` = **manual review trigger** (threshold-based)
- `decline_flag` = **stricter high-risk flag** (threshold-based)

This mirrors a realistic workflow where the model can be used to **route applications into different actions** (e.g., review/verification vs stricter filtering).

---

## Data & Target
**Dataset:** LendingClub-style loan dataset (`loan_status` as label).

Target mapping:
- `Charged Off` → `1` (default)
- `Fully Paid` → `0` (non-default)

Default rate in the final modelling dataset is approximately **17.9%**.

---

## Approach

### 1) Data Preparation (one-time build)
Implemented in `src/prepare_data.py`. Steps:
- drop columns with >50% missing values
- remove high-cardinality text fields (e.g., job title, title, description, zip)
- remove leakage features (post-outcome payment/recovery variables)
- filter to final outcomes only (`Fully Paid`, `Charged Off`)
- create `target` and `log_income`
- save clean dataset to Parquet for fast loading

Output:
- `data/loans_clean.parquet`

### 2) Feature Engineering
Implemented in `src/train.py` and mirrored in the API:
- `loan_to_income = loan_amnt / annual_inc`
- `utilization_flag = 1 if revol_util > 80 else 0`

### 3) Preprocessing 
Implemented in `src/features.py` using a scikit-learn `ColumnTransformer` so training and inference use identical transforms:
- **numeric:** median imputation (+ optional scaling)
- **categorical:** most-frequent imputation + OneHotEncoder (`handle_unknown="ignore"`, capped categories)

This prevents mismatches between training transformations and API-time transformations.

### 4) Models
Benchmarked:
- Logistic Regression (baseline)
- Logistic Regression (class_weight="balanced")
- **XGBoost (final)**

---

## Results

### Ranking Performance (ROC-AUC)
ROC-AUC measures how well the model ranks risky loans above non-risky loans (threshold-independent).

- Logistic Regression: **0.706**
- XGBoost: **0.714**

### Threshold Performance (XGBoost)
**ROC-AUC:** 0.714

Because credit decisions depend on the operating policy, I report metrics at two thresholds:

- **Threshold = 0.10 (screening / review)**  
  - **Recall:** 0.898  
  - **Precision:** 0.227  
  - **F1:** 0.362  
  **Interpretation:** A conservative screening policy that catches ~90% of true defaults (high recall) but increases false positives. This is suitable when the action is **manual review / additional verification** rather than automatic rejection.

- **Threshold = 0.20 (more selective filtering)**  
  - **Recall:** 0.603  
  - **Precision:** 0.307  
  - **F1:** 0.407  
  **Interpretation:** A more selective policy that flags fewer loans, improving precision but missing more defaults. This is closer to an approve/decline-style decision threshold.

In general, lowering the threshold increases recall (catching more defaults) at the cost of precision (flagging more non-default loans), reflecting the typical precision–recall trade-off in credit risk modelling.

---

## Deployment Policy (API Flags)

The deployed API returns **two threshold-based flags** to represent different operational actions:

- **`review_flag`**: triggers **manual review / verification**  
  - **review_threshold = 0.10**
- **`decline_flag`**: stricter high-risk flag for potential **decline / escalation**  
  - **decline_threshold = 0.30**

This makes the endpoint usable as a **triage tool** (review queue) and a stricter risk indicator without forcing a single “approve/decline” rule.

---

## API Usage

### Example Request 
From repo root:

```bash
curl -X POST "https://credit-risk-analysis-iuyk.onrender.com/predict" \
  -H "Content-Type: application/json" \
  -d @examples/request.json
```

### Example Request Body
{
  "loan_amnt": 10000,
  "term": " 36 months",
  "int_rate": 12.5,
  "grade": "B",
  "annual_inc": 70000,
  "dti": 18.2,
  "revol_util": 45,
  "purpose": "credit_card",
  "home_ownership": "RENT",
  "verification_status": "Verified"
}

### Example Response
{
  "pd_default": 0.098857,
  "review_threshold": 0.1,
  "review_flag": 0,
  "decline_threshold": 0.3,
  "decline_flag": 0
}

### Notes/Limitations
- This project is for educational/portfolio purposes and is not intended for real lending decisions.
- Threshold selection depends on business goals (minimising defaults vs maximising approvals) and operational capacity (manual review volume).
- Performance may vary across time periods (loan “vintages”) and feature availability at application time.
