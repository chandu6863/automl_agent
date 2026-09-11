from __future__ import annotations

import time
from pathlib import Path

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def _preprocessor(frame: pd.DataFrame) -> ColumnTransformer:
    numeric = frame.select_dtypes(include=["number"]).columns.tolist()
    categorical = [column for column in frame.columns if column not in numeric]
    return ColumnTransformer(
        transformers=[
            ("numeric", Pipeline([("imputer", SimpleImputer(strategy="median")), ("scale", StandardScaler())]), numeric),
            ("categorical", Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("encode", OneHotEncoder(handle_unknown="ignore"))]), categorical),
        ],
        remainder="drop",
    )


def run_baselines(path: str, target_column: str, seed: int = 42) -> dict:
    frame = pd.read_csv(Path(path)) if path.lower().endswith(".csv") else pd.read_excel(Path(path))
    if target_column not in frame.columns:
        raise ValueError(f"Target column '{target_column}' was not found")
    frame = frame.dropna(subset=[target_column])
    if len(frame) < 5:
        raise ValueError("At least 5 rows are required to train a baseline model")

    target = frame.pop(target_column)
    task_type = "CLASSIFICATION" if target.dtype == "object" or target.nunique() <= 20 else "REGRESSION"
    if task_type == "CLASSIFICATION" and target.nunique() < 2:
        raise ValueError("Classification requires at least two target classes")

    test_size = max(0.2, min(0.4, 2 / len(frame)))
    stratify = target if task_type == "CLASSIFICATION" and target.value_counts().min() >= 2 else None
    x_train, x_test, y_train, y_test = train_test_split(frame, target, test_size=test_size, random_state=seed, stratify=stratify)
    candidates = (
        [("Logistic Regression", LogisticRegression(max_iter=500, random_state=seed)), ("Random Forest", RandomForestClassifier(n_estimators=100, random_state=seed))]
        if task_type == "CLASSIFICATION"
        else [("Ridge Regression", Ridge(alpha=1.0)), ("Random Forest", RandomForestRegressor(n_estimators=100, random_state=seed))]
    )

    results = []
    for name, estimator in candidates:
        started = time.perf_counter()
        pipeline = Pipeline([("preprocess", _preprocessor(x_train)), ("model", estimator)])
        pipeline.fit(x_train, y_train)
        prediction = pipeline.predict(x_test)
        if task_type == "CLASSIFICATION":
            metrics = {"accuracy": round(float(accuracy_score(y_test, prediction)), 4), "f1": round(float(f1_score(y_test, prediction, average="weighted", zero_division=0)), 4)}
            score = metrics["f1"]
        else:
            rmse = mean_squared_error(y_test, prediction) ** 0.5
            metrics = {"rmse": round(float(rmse), 4), "r2": round(float(r2_score(y_test, prediction)), 4)}
            score = metrics["r2"]
        results.append({"model_name": name, "metrics": metrics, "score": score, "training_time_ms": round((time.perf_counter() - started) * 1000)})

    results.sort(key=lambda result: result["score"], reverse=True)
    return {"task_type": task_type, "target_column": target_column, "metric": "f1" if task_type == "CLASSIFICATION" else "r2", "results": results}