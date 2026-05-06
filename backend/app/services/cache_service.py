import json
from typing import Any

import redis

from app.core.config import settings


class CacheService:
    def __init__(self) -> None:
        self.client = redis.from_url(settings.redis_url, decode_responses=True)

    def get_json(self, key: str) -> Any | None:
        raw = self.client.get(key)
        if raw is None:
            return None
        return json.loads(raw)

    def set_json(self, key: str, value: Any, ttl_seconds: int = 1800) -> None:
        self.client.setex(key, ttl_seconds, json.dumps(value))
