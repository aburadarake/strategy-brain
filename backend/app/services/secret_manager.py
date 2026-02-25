"""GCP Secret Manager — APIキー管理."""

from __future__ import annotations

import os
from typing import Optional


def get_secret(project_id: str, secret_name: str, version: str = "latest") -> Optional[str]:
    """
    GCP Secret Manager からシークレットを取得する。

    必要な権限: roles/secretmanager.secretAccessor
    認証: gcloud auth application-default login または
          GOOGLE_APPLICATION_CREDENTIALS 環境変数
    """
    try:
        from google.cloud import secretmanager  # type: ignore

        client = secretmanager.SecretManagerServiceClient()
        name = f"projects/{project_id}/secrets/{secret_name}/versions/{version}"
        response = client.access_secret_version(request={"name": name})
        value = response.payload.data.decode("UTF-8").strip()
        return value if value else None
    except ImportError:
        # google-cloud-secret-manager 未インストール
        return None
    except Exception:
        # IAM権限不足・シークレット未存在など — 無音でフォールバック
        return None
