"""Wipes and reseeds the SQLite DB with synthetic demo data plus demo login accounts.

Run with: venv/Scripts/python.exe -m app.data_gen.seed
"""

from datetime import date, timedelta

from app.auth import hash_password
from app.data_gen.generate import generate_dataset
from app.database import Base, SessionLocal, engine
from app.models import (
    Enterprise,
    ExternalIndicator,
    FinancialRecord,
    Loan,
    Role,
    UpiTransaction,
    User,
)

DEMO_PASSWORD = "demo1234"


def run():
    print("Dropping and recreating tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Generating synthetic dataset...")
        dataset = generate_dataset()

        print(f"Inserting {len(dataset.enterprises)} enterprises...")
        enterprise_objs = {}
        for spec in dataset.enterprises:
            ent = Enterprise(
                id=spec.id,
                name=spec.name,
                sector=spec.sector,
                state=spec.state,
                district=spec.district,
                years_in_operation=spec.years_in_operation,
                size=spec.size,
            )
            db.add(ent)
            enterprise_objs[spec.id] = ent
        db.flush()

        print(f"Inserting {len(dataset.external_indicators)} external indicator rows...")
        for row in dataset.external_indicators:
            db.add(ExternalIndicator(**row))

        print(f"Inserting {len(dataset.financials)} financial records...")
        for row in dataset.financials:
            db.add(FinancialRecord(**row))

        print(f"Inserting {len(dataset.upi_transactions)} UPI transaction rows...")
        for row in dataset.upi_transactions:
            db.add(UpiTransaction(**row))

        print(f"Inserting {len(dataset.loans)} loans...")
        for row in dataset.loans:
            row = dict(row)
            offset = row.pop("_start_offset")
            row["start_month"] = date.today().replace(day=1) - timedelta(days=offset * 30)
            db.add(Loan(**row))

        db.commit()

        print("Creating demo login accounts...")
        officer = User(
            email="officer@nabard.demo",
            full_name="Field Officer Demo",
            password_hash=hash_password(DEMO_PASSWORD),
            role=Role.field_officer,
        )
        db.add(officer)

        worsening_specs = [s for s in dataset.enterprises if s.worsening]
        stable_specs = [s for s in dataset.enterprises if not s.worsening]
        demo_owner_targets = (worsening_specs[:1] + stable_specs[:1]) or dataset.enterprises[:2]
        for i, spec in enumerate(demo_owner_targets):
            owner = User(
                email=f"owner{i + 1}@nabard.demo",
                full_name=f"{spec.name} Owner",
                password_hash=hash_password(DEMO_PASSWORD),
                role=Role.enterprise_owner,
                enterprise_id=spec.id,
            )
            db.add(owner)
            print(f"  owner{i + 1}@nabard.demo -> enterprise #{spec.id} ({spec.name}) "
                  f"[{'worsening' if spec.worsening else 'stable'}]")

        db.commit()
        print("\nSeed complete.")
        print("Demo credentials (password for all: 'demo1234'):")
        print("  Field officer: officer@nabard.demo")
        for i in range(len(demo_owner_targets)):
            print(f"  Enterprise owner: owner{i + 1}@nabard.demo")
    finally:
        db.close()


if __name__ == "__main__":
    run()
