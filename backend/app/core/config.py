from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Road Trip Backend"
    app_env: str = "development"
    cors_origin: str = "http://localhost:3000"

    # Maps: use Google (billing) OR free-tier alternatives — see .env.example
    maps_route_provider: str = "auto"
    maps_places_provider: str = "auto"
    google_maps_api_key: str = ""
    openrouteservice_api_key: str = ""

    # Weather: OpenWeather (needs key) OR Open-Meteo (no key)
    weather_provider: str = "auto"
    weather_api_key: str = ""

    # LLM: Gemini (Google AI) OR OpenAI-compatible
    llm_provider: str = "auto"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_base_url: str = ""

    redis_url: str = "redis://localhost:6379/0"
    mongo_url: str = "mongodb://localhost:27017"
    mongo_db_name: str = "ai_trip_planner"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
