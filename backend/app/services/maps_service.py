import re

import httpx

from app.core.config import settings

ORS_BASE = "https://api.openrouteservice.org"
NOMINATIM_BASE = "https://nominatim.openstreetmap.org"
USER_AGENT = "GMapAI/1.0 (road-trip planner; local dev)"

_TAG_RE = re.compile(r"<[^>]+>")


def _strip_html(text: str) -> str:
    return _TAG_RE.sub("", text or "").replace("&nbsp;", " ").strip()


def _google_turn_by_turn(directions_payload: dict) -> list[dict]:
    steps_out: list[dict] = []
    routes = directions_payload.get("routes") or []
    if not routes:
        return steps_out
    legs = routes[0].get("legs") or []
    idx = 0
    for leg in legs:
        for step in leg.get("steps") or []:
            idx += 1
            txt = _strip_html(step.get("html_instructions", ""))
            dist = step.get("distance", {}).get("value") if isinstance(step.get("distance"), dict) else None
            steps_out.append(
                {
                    "step": idx,
                    "text": txt,
                    "distance_m": int(dist) if dist is not None else None,
                    "duration_s": (
                        int(step["duration"]["value"])
                        if isinstance(step.get("duration"), dict) and step["duration"].get("value") is not None
                        else None
                    ),
                }
            )
    return steps_out


def _ors_turn_by_turn(props: dict) -> list[dict]:
    steps_out: list[dict] = []
    idx = 0
    for seg in props.get("segments") or []:
        for step in seg.get("steps") or []:
            idx += 1
            instr = (step.get("instruction") or "").strip()
            if not instr:
                continue
            dist = step.get("distance")
            dur = step.get("duration")
            steps_out.append(
                {
                    "step": idx,
                    "text": instr,
                    "distance_m": int(dist) if dist is not None else None,
                    "duration_s": int(dur) if dur is not None else None,
                }
            )
    return steps_out


def _route_provider_resolved() -> str:
    p = (settings.maps_route_provider or "auto").strip().lower()
    if p == "auto":
        if settings.google_maps_api_key:
            return "google"
        if settings.openrouteservice_api_key:
            return "openrouteservice"
        return "openrouteservice"
    return p


def _places_provider_resolved() -> str:
    p = (settings.maps_places_provider or "auto").strip().lower()
    if p == "auto":
        if settings.google_maps_api_key:
            return "google"
        return "nominatim"
    return p


class MapsService:
    async def optimize_route(self, source: str, destination: str, waypoints: list[str]) -> dict:
        provider = _route_provider_resolved()
        if provider == "google":
            return await self._optimize_route_google(source, destination, waypoints)
        if provider == "openrouteservice":
            return await self._optimize_route_ors(source, destination)
        raise RuntimeError(f"Unknown MAPS_ROUTE_PROVIDER: {provider}")

    async def _optimize_route_google(self, source: str, destination: str, waypoints: list[str]) -> dict:
        if not settings.google_maps_api_key:
            raise RuntimeError(
                "GOOGLE_MAPS_API_KEY is missing. Set it, or use OpenRouteService: "
                "MAPS_ROUTE_PROVIDER=openrouteservice and OPENROUTESERVICE_API_KEY (free at openrouteservice.org)."
            )

        params: dict[str, str] = {
            "origin": source,
            "destination": destination,
            "key": settings.google_maps_api_key,
        }
        if waypoints:
            params["waypoints"] = "|".join(waypoints)
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                "https://maps.googleapis.com/maps/api/directions/json",
                params=params,
            )
            response.raise_for_status()
            data = response.json()
        status = data.get("status", "UNKNOWN_ERROR")
        if status != "OK" or not data.get("routes"):
            detail = data.get("error_message", "")
            hint = (
                " Enable Directions API and billing on the Google Cloud project for this key, "
                "or switch to MAPS_ROUTE_PROVIDER=openrouteservice with OPENROUTESERVICE_API_KEY."
            )
            msg = f"Google Directions failed: {status}"
            if detail:
                msg += f" — {detail}"
            raise RuntimeError(msg + hint)
        return {
            "provider": "google_maps",
            "raw": data,
            "steps": _google_turn_by_turn(data),
        }

    async def _geocode_ors(self, client: httpx.AsyncClient, label: str, query: str) -> tuple[float, float]:
        if not settings.openrouteservice_api_key:
            raise RuntimeError(
                "OPENROUTESERVICE_API_KEY is missing. Get a free key at https://openrouteservice.org/ "
                "or use Google Maps with GOOGLE_MAPS_API_KEY and MAPS_ROUTE_PROVIDER=google."
            )
        response = await client.get(
            f"{ORS_BASE}/geocode/search",
            params={
                "api_key": settings.openrouteservice_api_key,
                "text": query,
                "size": 1,
            },
        )
        response.raise_for_status()
        payload = response.json()
        features = payload.get("features") or []
        if not features:
            raise RuntimeError(f"OpenRouteService could not geocode “{label}”. Try a clearer place name.")
        geom = (features[0].get("geometry") or {}).get("coordinates")
        if not geom or len(geom) < 2:
            raise RuntimeError(f"OpenRouteService geocode response invalid for “{label}”.")
        lon, lat = float(geom[0]), float(geom[1])
        return lat, lon

    async def _optimize_route_ors(self, source: str, destination: str) -> dict:
        if not settings.openrouteservice_api_key:
            raise RuntimeError(
                "OPENROUTESERVICE_API_KEY is missing. Sign up at https://openrouteservice.org/ (free tier), "
                "or set GOOGLE_MAPS_API_KEY and MAPS_ROUTE_PROVIDER=google."
            )

        async with httpx.AsyncClient(timeout=45) as client:
            lat_s, lon_s = await self._geocode_ors(client, "origin", source)
            lat_d, lon_d = await self._geocode_ors(client, "destination", destination)
            body = {
                "coordinates": [
                    [lon_s, lat_s],
                    [lon_d, lat_d],
                ]
            }
            response = await client.post(
                f"{ORS_BASE}/v2/directions/driving-car/geojson",
                params={"api_key": settings.openrouteservice_api_key},
                json=body,
            )
            response.raise_for_status()
            fc = response.json()

        features = fc.get("features") or []
        if not features:
            raise RuntimeError("OpenRouteService returned no route between those places.")

        feat = features[0]
        geom = feat.get("geometry") or {}
        coords = geom.get("coordinates") or []
        props = feat.get("properties") or {}
        summary = props.get("summary") or {}
        dist_m = float(summary.get("distance", 0))
        dur_s = float(summary.get("duration", 0))

        if not coords or len(coords) < 2:
            raise RuntimeError("OpenRouteService route geometry was empty.")

        lng0, lat0 = coords[0][0], coords[0][1]
        lng1, lat1 = coords[-1][0], coords[-1][1]

        synthetic = {
            "status": "OK",
            "routes": [
                {
                    "overview_polyline": {},
                    "coordinates_lnglat": [[float(c[0]), float(c[1])] for c in coords],
                    "legs": [
                        {
                            "distance": {"value": int(dist_m)},
                            "duration": {"value": int(dur_s)},
                            "start_location": {"lat": lat0, "lng": lng0},
                            "end_location": {"lat": lat1, "lng": lng1},
                        }
                    ],
                }
            ],
        }
        steps = _ors_turn_by_turn(props)
        return {"provider": "openrouteservice", "raw": synthetic, "steps": steps}

    async def recommend_places(self, location: str, interests: list[str], budget: str) -> dict:
        provider = _places_provider_resolved()
        if provider == "google":
            return await self._places_google(location, interests, budget)
        if provider == "nominatim":
            return await self._places_nominatim(location, interests, budget)
        raise RuntimeError(f"Unknown MAPS_PLACES_PROVIDER: {provider}")

    async def _places_google(self, location: str, interests: list[str], budget: str) -> dict:
        if not settings.google_maps_api_key:
            raise RuntimeError(
                "GOOGLE_MAPS_API_KEY is missing for Places. "
                "Set MAPS_PLACES_PROVIDER=nominatim for free OSM search (no Google billing)."
            )

        query_parts = [location]
        if interests:
            query_parts.append(", ".join(interests))
        query = " ".join(query_parts)

        params = {"query": query, "key": settings.google_maps_api_key}
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                "https://maps.googleapis.com/maps/api/place/textsearch/json",
                params=params,
            )
            response.raise_for_status()
            data = response.json()

        status = data.get("status", "UNKNOWN_ERROR")
        if status not in {"OK", "ZERO_RESULTS"}:
            detail = data.get("error_message", "")
            hint = (
                " Enable Places API and billing, or use MAPS_PLACES_PROVIDER=nominatim (free, OpenStreetMap)."
            )
            msg = f"Google Places failed: {status}"
            if detail:
                msg += f" — {detail}"
            raise RuntimeError(msg + hint)

        recommendations = [
            {
                "name": result.get("name"),
                "address": result.get("formatted_address"),
                "rating": result.get("rating"),
                "types": result.get("types", []),
            }
            for result in data.get("results", [])[:10]
        ]

        return {
            "provider": "google_places",
            "location": location,
            "budget": budget,
            "interests": interests,
            "recommendations": recommendations,
        }

    async def _places_nominatim(self, location: str, interests: list[str], budget: str) -> dict:
        parts = [location]
        if interests:
            parts.extend(interests[:3])
        q = " ".join(parts)
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                f"{NOMINATIM_BASE}/search",
                params={
                    "q": q,
                    "format": "json",
                    "limit": 10,
                },
                headers={"User-Agent": USER_AGENT},
            )
            response.raise_for_status()
            rows = response.json()

        recommendations = []
        for row in rows[:10]:
            name = row.get("display_name", "").split(",")[0].strip() or row.get("name")
            recommendations.append(
                {
                    "name": name,
                    "address": row.get("display_name"),
                    "rating": None,
                    "types": row.get("type", "").split() if row.get("type") else [],
                }
            )

        return {
            "provider": "nominatim",
            "location": location,
            "budget": budget,
            "interests": interests,
            "recommendations": recommendations,
        }
