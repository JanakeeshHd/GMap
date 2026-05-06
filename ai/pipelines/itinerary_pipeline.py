from dataclasses import dataclass


@dataclass
class ItineraryInput:
    source: str
    destination: str
    days: int
    budget: str = "medium"


def build_itinerary_prompt(data: ItineraryInput) -> str:
    return (
        f"Plan a {data.days}-day road trip from {data.source} to {data.destination}. "
        f"Budget preference: {data.budget}. Return concise day-wise recommendations."
    )
