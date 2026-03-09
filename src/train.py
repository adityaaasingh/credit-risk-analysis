# src/train.py

import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, recall_score, precision_score, f1_score
from xgboost import XGBClassifier

from src.features import build_preprocessor
from src.data import load_data


def evaluate_model(name, model, X_train, y_train, X_test, y_test, thresholds=None, top_k_features=20):
    if thresholds is None:
        thresholds = np.arange(0.1, 0.6, 0.1)

    print("\n" + "=" * 70)
    print(f"{name}")
    print("=" * 70)

    print("Fitting model...")
    model.fit(X_train, y_train)
    print("Done.")

    # Probabilities + ROC-AUC
    y_probs = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, y_probs)
    print(f"ROC-AUC: {auc:.3f}")

    # Threshold table
    for t in thresholds:
        y_pred_t = (y_probs >= t).astype(int)
        print(
            f"Threshold {t:.1f} | "
            f"Recall: {recall_score(y_test, y_pred_t):.3f} | "
            f"Precision: {precision_score(y_test, y_pred_t):.3f} | "
            f"F1: {f1_score(y_test, y_pred_t):.3f}"
        )

    # Coefficients 
    clf = model.named_steps["clf"]

    coef_df = None  # default for models without coefficients
    imp_df = None

    if hasattr(clf, "coef_"):
        # LogisticRegression (and other linear models)
        feature_names = model.named_steps["preprocessor"].get_feature_names_out()
        coefs = clf.coef_.ravel()

        coef_df = pd.DataFrame({"feature": feature_names, "coefficient": coefs})
        coef_df["abs_coef"] = coef_df["coefficient"].abs()
        coef_df = coef_df.sort_values("abs_coef", ascending=False)

        print(f"\nNumber of engineered features: {len(coef_df)}")
        print(f"Top {top_k_features} coefficients by absolute value:")
        print(coef_df.head(top_k_features).to_string(index=False))

    elif hasattr(clf, "feature_importances_"):
        # Tree models (XGBoost, RandomForest, etc.)
        feature_names = model.named_steps["preprocessor"].get_feature_names_out()
        importances = clf.feature_importances_

        imp_df = pd.DataFrame({"feature": feature_names, "importance": importances})
        imp_df = imp_df.sort_values("importance", ascending=False)

        print(f"\nNumber of engineered features: {len(imp_df)}")
        print(f"Top {top_k_features} features by importance:")
        print(imp_df.head(top_k_features).to_string(index=False))

    else:
        print("\n(No coefficients/feature_importances_ available for this model.)")

    return auc, model, (coef_df if coef_df is not None else imp_df)


def main():

    RUN_LOGREG = False
    RUN_LOGREG_BALANCED = False

    # 1) Load dataset
    df = load_data("/Users/adityasingh/Documents/credit-risk-analysis/data/loans_clean.parquet")

    # 2) Feature engineering
    df["loan_to_income"] = df["loan_amnt"] / df["annual_inc"].replace(0, np.nan)
    df["utilization_flag"] = (df["revol_util"] > 80).fillna(0).astype(int)

    # 3) Split features/target
    y = df["target"]
    X = df.drop(columns=["target", "loan_status"], errors="ignore")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # 4) Same preprocessor for both models (fit happens inside pipeline during .fit)
    preprocessor = build_preprocessor(X_train, scale_numeric=True)

    # 5) Model A: baseline logistic (no class_weight)
    baseline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("clf", LogisticRegression(max_iter=3000, solver="saga"))
    ])

    # 6) Model B: class-weight balanced logistic
    balanced = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("clf", LogisticRegression(max_iter=3000, solver="saga", class_weight="balanced"))
    ])

    # 7) Evaluate both
    if RUN_LOGREG:
        auc_a, baseline_fitted, coef_a = evaluate_model(
            "Logistic Regression (Baseline)", baseline, X_train, y_train, X_test, y_test
        )

    if RUN_LOGREG_BALANCED:
        auc_b, balanced_fitted, coef_b = evaluate_model(
            "Logistic Regression (Class Weight = balanced)", balanced, X_train, y_train, X_test, y_test
        )

    # 8) Summary comparison
    if RUN_LOGREG or RUN_LOGREG_BALANCED:
        print("\n" + "-" * 70)
        print("Summary")
        print("-" * 70)
        print(f"Baseline ROC-AUC: {auc_a:.3f}")
        print(f"Balanced ROC-AUC: {auc_b:.3f}")

    # 9) Model C: Baseline XGBoost
    xgb_model = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("clf", XGBClassifier(
        n_estimators=500,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_lambda=1.0,
        random_state=42,
        n_jobs=-1,
        eval_metric="logloss"
    ))])

    auc_xgb, xgb_fitted, _ = evaluate_model(
        "XGBoost (baseline params)",
        xgb_model,
        X_train, y_train, X_test, y_test
    )

    from pathlib import Path
    import joblib
    Path("models").mkdir(exist_ok=True)
    joblib.dump(xgb_fitted, "models/xgb_final.pkl")
    print("✅ Saved XGBoost model to models/xgb_final.pkl")


if __name__ == "__main__":
    main()


