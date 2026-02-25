"""Application configuration using pydantic-settings."""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # LLM API Keys (空の場合は Secret Manager からフォールバック)
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    # LLM Provider Selection
    llm_provider: Literal["openai", "anthropic", "vertex"] = "openai"

    # Model Settings
    openai_model: str = "gpt-4o"
    anthropic_model: str = "claude-opus-4-6"
    vertex_model: str = "claude-opus-4-5@20251101"
    vertex_region: str = "us-east5"
    gcp_project_id: str = ""

    # Secret Manager — True にすると GCP Secret Manager からキーを取得
    use_secret_manager: bool = False

    # Server Settings
    host: str = "0.0.0.0"
    port: int = 8001
    debug: bool = True

    # ── Secret Manager フォールバック ──────────────────────────
    def get_openai_key(self) -> str:
        """OpenAI APIキーを取得。空なら Secret Manager を参照。"""
        if self.openai_api_key:
            return self.openai_api_key
        if self.use_secret_manager and self.gcp_project_id:
            from app.services.secret_manager import get_secret
            return get_secret(self.gcp_project_id, "OPENAI_API_KEY") or ""
        return ""

    def get_anthropic_key(self) -> str:
        """Anthropic APIキーを取得。空なら Secret Manager を参照。"""
        if self.anthropic_api_key:
            return self.anthropic_api_key
        if self.use_secret_manager and self.gcp_project_id:
            from app.services.secret_manager import get_secret
            return get_secret(self.gcp_project_id, "ANTHROPIC_API_KEY") or ""
        return ""


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
