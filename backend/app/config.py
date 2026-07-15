from pathlib import Path

from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    database_url: str = f"sqlite:///{BASE_DIR / 'nabard.db'}"
    jwt_secret: str = "nabard-hackathon-dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7
    ml_artifacts_dir: Path = BASE_DIR / "app" / "ml" / "artifacts"


settings = Settings()
