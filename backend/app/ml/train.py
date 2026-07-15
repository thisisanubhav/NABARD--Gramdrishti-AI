"""Trains the forecast and risk models from the seeded DB and writes artifacts.

Run with: venv/Scripts/python.exe -m app.ml.train
"""

from app.config import settings
from app.database import SessionLocal
from app.ml import forecast_model, risk_model
from app.ml.features import build_training_panel


def run():
    db = SessionLocal()
    try:
        print("Building training panel from DB...")
        df = build_training_panel(db)
        print(f"Panel shape: {df.shape}")
        print("Risk label distribution:\n", df["risk_label"].value_counts())

        print("\nTraining forecast model (LightGBM regressor on next-month delta)...")
        fmodel, residual_std, fmetrics = forecast_model.train(df)
        print(f"  MAE={fmetrics['val_mae']:.2f}  residual_std={fmetrics['val_residual_std']:.2f}  "
              f"n_train={fmetrics['n_train']} n_val={fmetrics['n_val']}")
        forecast_model.save(fmodel, residual_std, settings.ml_artifacts_dir)

        print("\nTraining risk classifier (LightGBM multiclass)...")
        rmodel, rmetrics = risk_model.train(df)
        print(f"  val_accuracy={rmetrics['val_accuracy']:.3f}  n_train={rmetrics['n_train']} "
              f"n_val={rmetrics['n_val']}")
        print(f"  class balance: {rmetrics['class_balance']}")
        risk_model.save(rmodel, settings.ml_artifacts_dir)

        print(f"\nArtifacts written to {settings.ml_artifacts_dir}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
