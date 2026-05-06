from datetime import datetime
from typing import Any

from pymongo import MongoClient

from app.core.config import settings


class DBService:
    def __init__(self) -> None:
        client = MongoClient(settings.mongo_url)
        self.db = client[settings.mongo_db_name]

    def save_plan(self, payload: dict[str, Any], result: dict[str, Any]) -> None:
        self.db.trip_plans.insert_one(
            {
                "input": payload,
                "output": result,
                "created_at": datetime.utcnow()
            }
        )
