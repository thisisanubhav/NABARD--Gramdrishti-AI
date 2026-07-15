"""Financial-risk classifier: LightGBM multiclass model trained on
rule-bootstrapped Low/Medium/High labels (see features._bootstrap_risk_label),
so it learns to generalize the rule pattern rather than just replay it.
Explainability comes from SHAP TreeExplainer values against the High-risk
class probability, which gives a consistent "what's pushing this enterprise
toward risk" story regardless of which level ends up predicted."""

from pathlib import Path

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
import shap
from sklearn.model_selection import train_test_split

from app.ml.features import FEATURE_COLUMNS, FEATURE_LABELS

MODEL_FILENAME = "risk_model.pkl"
LEVELS = ["low", "medium", "high"]
LEVEL_TO_IDX = {level: i for i, level in enumerate(LEVELS)}
HORIZON_BY_LEVEL = {"high": 1, "medium": 3, "low": 6}


def train(df: pd.DataFrame) -> tuple[lgb.LGBMClassifier, dict]:
    X = df[FEATURE_COLUMNS]
    y = df["risk_label"].map(LEVEL_TO_IDX)

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )

    model = lgb.LGBMClassifier(
        n_estimators=250,
        learning_rate=0.05,
        num_leaves=31,
        min_child_samples=10,
        objective="multiclass",
        num_class=3,
        random_state=42,
        verbose=-1,
    )
    model.fit(X_train, y_train)

    val_acc = float(model.score(X_val, y_val))
    metrics = {
        "val_accuracy": val_acc,
        "n_train": len(X_train),
        "n_val": len(X_val),
        "class_balance": df["risk_label"].value_counts(normalize=True).to_dict(),
    }
    return model, metrics


def save(model: lgb.LGBMClassifier, artifacts_dir: Path):
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model}, artifacts_dir / MODEL_FILENAME)


def load(artifacts_dir: Path) -> lgb.LGBMClassifier:
    payload = joblib.load(artifacts_dir / MODEL_FILENAME)
    return payload["model"]


_explainer_cache: dict = {}


def _get_explainer(model: lgb.LGBMClassifier) -> shap.TreeExplainer:
    key = id(model)
    if key not in _explainer_cache:
        _explainer_cache.clear()  # only ever one model loaded per process
        _explainer_cache[key] = shap.TreeExplainer(model)
    return _explainer_cache[key]


def _shap_values_for_high(model: lgb.LGBMClassifier, X: pd.DataFrame) -> np.ndarray:
    explainer = _get_explainer(model)
    raw = explainer.shap_values(X)
    high_idx = LEVEL_TO_IDX["high"]
    if isinstance(raw, list):
        return raw[high_idx][0]
    arr = np.asarray(raw)
    if arr.ndim == 3:
        return arr[0, :, high_idx]
    return arr[0]


SEVERITY_WEIGHT = {"low": 0.0, "medium": 0.5, "high": 1.0}


def predict(model: lgb.LGBMClassifier, X: pd.DataFrame, top_k: int = 4) -> dict:
    proba = model.predict_proba(X)[0]
    pred_idx = int(np.argmax(proba))
    level = LEVELS[pred_idx]
    # Expected-severity score (0-1): weighted by class probabilities rather than
    # raw P(high) alone, so a confidently "medium" case still shows a mid-range
    # score instead of collapsing toward zero.
    risk_score = float(sum(proba[LEVEL_TO_IDX[lv]] * SEVERITY_WEIGHT[lv] for lv in LEVELS))

    shap_vals = _shap_values_for_high(model, X)
    order = np.argsort(-np.abs(shap_vals))[:top_k]

    drivers = []
    for i in order:
        feature = FEATURE_COLUMNS[i]
        impact = float(shap_vals[i])
        if abs(impact) < 1e-6:
            continue
        drivers.append(
            dict(
                feature=feature,
                label=FEATURE_LABELS.get(feature, feature.replace("_", " ").title()),
                impact=impact,
                direction="increases_risk" if impact > 0 else "decreases_risk",
            )
        )

    return dict(
        level=level,
        score=risk_score,
        class_probabilities={LEVELS[i]: float(p) for i, p in enumerate(proba)},
        horizon_months=HORIZON_BY_LEVEL[level],
        drivers=drivers,
    )


def top_risk_driver_label(drivers: list[dict]) -> str | None:
    """First driver that actually pushes toward higher risk (as opposed to the
    single largest-magnitude driver overall, which may be a protective factor
    and would otherwise be misreported as the cause of the risk)."""
    for d in drivers:
        if d["direction"] == "increases_risk":
            return d["label"]
    return None
