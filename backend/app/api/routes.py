from fastapi import APIRouter
from fastapi import HTTPException
from fastapi.responses import StreamingResponse

from app.models.schemas import ChatRequest, PlacesRequest, PlanTripRequest, RouteRequest
from app.services.db_service import DBService
from app.services.llm_service import LLMService
from app.services.maps_service import MapsService
from app.services.weather_service import WeatherService

router = APIRouter()
llm_service = LLMService()
maps_service = MapsService()
weather_service = WeatherService()
db_service = DBService()


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.post("/plan-trip")
async def plan_trip(payload: PlanTripRequest) -> dict:
    try:
        result = llm_service.itinerary(
            source=payload.source,
            destination=payload.destination,
            days=payload.days,
            preferences=payload.preferences.model_dump(),
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    db_service.save_plan(payload.model_dump(), result)
    return result


@router.post("/optimize-route")
async def optimize_route(payload: RouteRequest) -> dict:
    try:
        return await maps_service.optimize_route(payload.source, payload.destination, payload.waypoints)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/recommend-places")
async def recommend_places(payload: PlacesRequest) -> dict:
    try:
        return await maps_service.recommend_places(payload.location, payload.interests, payload.budget)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/weather")
async def weather(source: str, destination: str) -> dict:
    try:
        return await weather_service.route_weather(source, destination)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/chat")
async def chat(payload: ChatRequest):
    if not payload.stream:
        try:
            text = llm_service.chat_reply(payload.message)
        except RuntimeError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        return {"message": text}

    try:
        stream_iter = llm_service.chat_reply_stream(payload.message)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    def stream():
        try:
            yield from stream_iter
        except Exception as exc:
            yield "\n\n[Chat stream error: " + str(exc) + "]"

    return StreamingResponse(stream(), media_type="text/plain; charset=utf-8")
