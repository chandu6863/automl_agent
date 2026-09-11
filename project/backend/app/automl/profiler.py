"""
Dataset Profiler
----------------
Produces the structured profile shown to the agent and stored in
DatasetMetadata.profiling_json. This is deliberately deterministic
(no LLM calls) so profiling results are reproducible.
"""
from __future__ import annotations

import pandas as pd


def load_dataframe(path: str) -> pd.DataFrame:
    if path.endswith(".csv"):
        return pd.read_csv(path)
    if path.endswith((".xlsx", ".xls")):
        return pd.read_excel(path)
    raise ValueError(f"Unsupported file type for: {path}")


def profile_dataframe(df: pd.DataFrame) -> dict:
    n_rows, n_cols = df.shape

    numerical_cols = df.select_dtypes(include=["number"]).columns.tolist()
    categorical_cols = df.select_dtypes(include=["object", "category", "bool"]).columns.tolist()

    missing = df.isna().sum()
    missing_by_column = {
        col: {"count": int(missing[col]), "pct": round(float(missing[col]) / n_rows * 100, 2)}
        for col in df.columns
        if missing[col] > 0
    }

    duplicate_rows = int(df.duplicated().sum())

    # Candidate target heuristic: prefer low-cardinality categorical/binary columns,
    # or numeric columns with few unique values (likely a label), named suggestively.
    candidate_targets: list[str] = []
    for col in df.columns:
        nunique = df[col].nunique(dropna=True)
        col_lower = col.lower()
        looks_like_label = any(
            kw in col_lower for kw in ("target", "label", "class", "churn", "outcome", "y")
        )
        if (2 <= nunique <= 20) or looks_like_label:
            candidate_targets.append(col)

    class_balance: dict[str, dict] = {}
    for col in candidate_targets:
        if df[col].nunique(dropna=True) <= 20:
            counts = df[col].value_counts(dropna=True)
            class_balance[col] = {str(k): int(v) for k, v in counts.items()}

    return {
        "row_count": int(n_rows),
        "column_count": int(n_cols),
        "numerical_columns": numerical_cols,
        "categorical_columns": categorical_cols,
        "missing_by_column": missing_by_column,
        "duplicate_rows": duplicate_rows,
        "candidate_target_columns": candidate_targets,
        "class_balance": class_balance,
        "column_dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
    }
