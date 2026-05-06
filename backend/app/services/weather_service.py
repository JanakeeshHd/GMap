import httpx

from app.core.config import settings


def _weather_provider_resolved() -> str:
    p = (settings.weather_provider or "auto").strip().lower()
    if p == "auto":
        if settings.weather_api_key:
            return "openweathermap"
        return "openmeteo"
    return p


# Open-Meteo WMO weather codes (short labels)
def _wmo_label(code: int | None) -> str:
    if code is None:
        return ""
    m = {
        0: "Clear",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Fog",
        51: "Drizzle",
        53: "Drizzle",
        55: "Drizzle",
        61: "Rain",
        63: "Rain",
        65: "Rain",
        71: "Snow",
        73: "Snow",
        75: "Snow",
        80: "Rain showers",
        81: "Rain showers",
        82: "Rain showers",
        95: "Thunderstorm",
        96: "Thunderstorm",
        99: "Thunderstorm",
    }
    return m.get(int(code), f"Weather code {code}")


class WeatherService:
    async def route_weather(self, source: str, destination: str) -> dict:
        provider = _weather_provider_resolved()
        if provider == "openweathermap":
            return await self._route_openweathermap(source, destination)
        if provider == "openmeteo":
            return await self._route_openmeteo(source, destination)
        raise RuntimeError(f"Unknown WEATHER_PROVIDER: {provider}")

    async def _route_openweathermap(self, source: str, destination: str) -> dict:
        if not settings.weather_api_key:
            raise RuntimeError(
                "WEATHER_API_KEY is missing for OpenWeatherMap. "
                "Or use free Open-Meteo: WEATHER_PROVIDER=openmeteo (no API key)."
            )

        async with httpx.AsyncClient(timeout=15) as client:
            source_response = await client.get(
                "https://api.openweathermap.org/data/2.5/forecast",
                params={"q": source, "appid": settings.weather_api_key, "units": "metric"},
            )
            destination_response = await client.get(
                "https://api.openweathermap.org/data/2.5/forecast",
                params={"q": destination, "appid": settings.weather_api_key, "units": "metric"},
            )
            source_response.raise_for_status()
            destination_response.raise_for_status()
            source_data = source_response.json()
            destination_data = destination_response.json()

        def parse_forecast(payload: dict) -> list[dict]:
            city_name = payload.get("city", {}).get("name", "")
            entries = payload.get("list", [])[:8]
            return [
                {
                    "city": city_name,
                    "timestamp": item.get("dt_txt"),
                    "temperature_c": item.get("main", {}).get("temp"),
                    "condition": (item.get("weather") or [{}])[0].get("description"),
                }
                for item in entries
            ]

        return {
            "provider": "openweathermap",
            "source": source,
            "destination": destination,
            "source_forecast": parse_forecast(source_data),
            "destination_forecast": parse_forecast(destination_data),
        }

    async def _geocode_openmeteo(self, client: httpx.AsyncClient, label: str, query: str) -> tuple[float, float, str]:
        response = await client.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": query.strip(), "count": 1, "language": "en", "format": "json"},
        )
        response.raise_for_status()
        payload = response.json()
        results = payload.get("results") or []
        if not results:
            raise RuntimeError(f"Open-Meteo could not find weather location for “{label}”. Try another spelling.")
        r0 = results[0]
        lat = float(r0["latitude"])
        lon = float(r0["longitude"])
        name = r0.get("name") or query
        return lat, lon, name

    async def _forecast_openmeteo_point(
        self, client: httpx.AsyncClient, lat: float, lon: float, city_label: str
    ) -> list[dict]:
        response = await client.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat,
                "longitude": lon,
                "hourly": "temperature_2m,weather_code",
                "forecast_days": 2,
            },
        )
        response.raise_for_status()
        data = response.json()
        hourly = data.get("hourly") or {}
        times = hourly.get("time") or []
        temps = hourly.get("temperature_2m") or []
        codes = hourly.get("weather_code") or []
        out: list[dict] = []
        for i in range(min(8, len(times))):
            t = temps[i] if i < len(temps) else None
            c = codes[i] if i < len(codes) else None
            out.append(
                {
                    "city": city_label,
                    "timestamp": times[i] if i < len(times) else "",
                    "temperature_c": t,
                    "condition": _wmo_label(int(c)) if c is not None else "",
                }
            )
        return out

    async def _route_openmeteo(self, source: str, destination: str) -> dict:
        async with httpx.AsyncClient(timeout=20) as client:
            lat_s, lon_s, name_s = await self._geocode_openmeteo(client, "source", source)
            lat_d, lon_d, name_d = await self._geocode_openmeteo(client, "destination", destination)
            src_fc = await self._forecast_openmeteo_point(client, lat_s, lon_s, name_s)
            dst_fc = await self._forecast_openmeteo_point(client, lat_d, lon_d, name_d)

        return {
            "provider": "openmeteo",
            "source": source,
            "destination": destination,
            "source_forecast": src_fc,
            "destination_forecast": dst_fc,
        }
