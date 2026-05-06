from typing import Literal

from pydantic import BaseModel, Field


class TripPreferences(BaseModel):
    budget: Literal["low", "medium", "high"] = "medium"
    interests: list[str] = Field(default_factory=list)
    transport: Literal["car", "bike", "ev"] = "car"


class PlanTripRequest(BaseModel):
    source: str
    destination: str
    days: int = Field(ge=1, le=14)
    preferences: TripPreferences = Field(default_factory=TripPreferences)


class ChatRequest(BaseModel):
    message: str
    stream: bool = True


class RouteRequest(BaseModel):
    source: str
    destination: str
    waypoints: list[str] = Field(default_factory=list)


class PlacesRequest(BaseModel):
    location: str
    interests: list[str] = Field(default_factory=list)
    budget: Literal["low", "medium", "high"] = "medium"
