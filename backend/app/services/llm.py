"""LLM Service supporting OpenAI, Anthropic, and Vertex AI."""

import json
import re
from functools import lru_cache
from typing import Any

from anthropic import AsyncAnthropic, AnthropicVertex
from openai import AsyncOpenAI

from app.config import get_settings


def _extract_json(text: str) -> dict[str, Any]:
    """
    LLMのレスポンスから堅牢にJSONを抽出してパースする。

    対応ケース:
    1. マークダウンコードブロック (```json ... ``` / ``` ... ```)
    2. 前置き・後置きテキスト付きJSON
    3. 末尾カンマ (trailing comma)
    4. 文字列内の生の制御文字（改行・タブなど）
    5. バックスラッシュエスケープの二重化
    """
    if not text or not text.strip():
        raise ValueError("LLMレスポンスが空です")

    # ── Strategy 1: マークダウンコードブロックを探す（最後の ``` を閉じとする）──
    open_fence = re.search(r"```(?:json)?\s*\n?", text)
    if open_fence:
        inner = text[open_fence.end():]
        # 閉じコードフェンスがあれば除去、なければそのまま使う
        last_fence = inner.rfind("```")
        candidate = (inner[:last_fence] if last_fence != -1 else inner).strip()
        result = _try_parse_json(candidate)
        if result is not None:
            return result
        # candidate から { ... } を取り出して再試行
        s = candidate.find("{")
        if s != -1:
            obj = _extract_outermost_object(candidate, s)
            if obj:
                result = _try_parse_json(obj)
                if result is not None:
                    return result

    # ── Strategy 2: 最外側の { ... } を抽出する ──────────────────
    start = text.find("{")
    if start != -1:
        candidate = _extract_outermost_object(text, start)
        if candidate:
            result = _try_parse_json(candidate)
            if result is not None:
                return result

    raise ValueError(f"JSONを抽出できませんでした。レスポンス先頭200文字: {text[:200]!r}")


def _extract_outermost_object(text: str, start: int) -> str | None:
    """最外側の { } ブロックを正確に抽出する（文字列内のブレースを無視）。"""
    depth = 0
    in_string = False
    escape_next = False

    for i, ch in enumerate(text[start:], start):
        if escape_next:
            escape_next = False
            continue
        if ch == "\\" and in_string:
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]
    return None


def _try_parse_json(candidate: str) -> dict[str, Any] | None:
    """JSONパースを段階的に試みる。成功したら辞書を返す、失敗したら None。"""
    # Pass 1: そのままパース
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        pass

    # Pass 2: 末尾カンマを除去してパース
    cleaned = re.sub(r",\s*([}\]])", r"\1", candidate)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Pass 3: 生の制御文字を除去（文字列内の改行 → \n、他は削除）
    def escape_control(m: re.Match) -> str:
        c = m.group()
        if c == "\n":
            return "\\n"
        if c == "\r":
            return "\\r"
        if c == "\t":
            return "\\t"
        return ""

    further_cleaned = re.sub(r'(?<!\\)[\x00-\x1f\x7f]', escape_control, cleaned)
    try:
        return json.loads(further_cleaned)
    except json.JSONDecodeError:
        pass

    return None


class LLMService:
    """Unified LLM service supporting OpenAI, Anthropic, and Vertex AI."""

    def __init__(self):
        self.settings = get_settings()
        self._openai_client: AsyncOpenAI | None = None
        self._anthropic_client: AsyncAnthropic | None = None
        self._vertex_client: AnthropicVertex | None = None

    @property
    def openai_client(self) -> AsyncOpenAI:
        if self._openai_client is None:
            self._openai_client = AsyncOpenAI(api_key=self.settings.get_openai_key())
        return self._openai_client

    @property
    def anthropic_client(self) -> AsyncAnthropic:
        if self._anthropic_client is None:
            self._anthropic_client = AsyncAnthropic(api_key=self.settings.get_anthropic_key())
        return self._anthropic_client

    @property
    def vertex_client(self) -> AnthropicVertex:
        if self._vertex_client is None:
            self._vertex_client = AnthropicVertex(
                project_id=self.settings.gcp_project_id,
                region=self.settings.vertex_region,
            )
        return self._vertex_client

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        provider: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        """Generate text using the configured LLM provider."""
        provider = provider or self.settings.llm_provider

        if provider == "openai":
            return await self._generate_openai(
                system_prompt, user_prompt, temperature, max_tokens
            )
        elif provider == "anthropic":
            return await self._generate_anthropic(
                system_prompt, user_prompt, temperature, max_tokens
            )
        elif provider == "vertex":
            return await self._generate_vertex(
                system_prompt, user_prompt, temperature, max_tokens
            )
        else:
            raise ValueError(f"Unknown LLM provider: {provider}")

    async def _generate_openai(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int,
    ) -> str:
        """Generate using OpenAI (async)."""
        response = await self.openai_client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""

    async def _generate_anthropic(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int,
    ) -> str:
        """Generate using Anthropic Claude (async)."""
        response = await self.anthropic_client.messages.create(
            model=self.settings.anthropic_model,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
            temperature=temperature,
        )
        return response.content[0].text

    async def _generate_vertex(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_tokens: int,
    ) -> str:
        """Generate using Claude on Vertex AI (GCP Application Default Credentials)."""
        response = self.vertex_client.messages.create(
            model=self.settings.vertex_model,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
            temperature=temperature,
        )
        return response.content[0].text

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        provider: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> dict[str, Any]:
        """Generate and parse JSON response."""
        provider = provider or self.settings.llm_provider

        json_system = (
            f"{system_prompt}\n\n"
            "重要: 必ず有効なJSONのみを出力してください。"
            "説明文・前置き・後置きテキスト・マークダウンは含めないでください。"
        )

        # OpenAI は response_format で確実に JSON を返させる
        if provider == "openai":
            response = await self.openai_client.chat.completions.create(
                model=self.settings.openai_model,
                messages=[
                    {"role": "system", "content": json_system},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                response_format={"type": "json_object"},
            )
            content = response.choices[0].message.content or "{}"
            return json.loads(content)

        response = await self.generate(
            json_system, user_prompt, provider, temperature, max_tokens
        )
        return _extract_json(response)


@lru_cache
def get_llm_service() -> LLMService:
    """Get cached LLM service instance."""
    return LLMService()
