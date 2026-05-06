import { PlacesResponse, PlanTripRequest, PlanTripResponse, RouteResponse, WeatherResponse } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function planTrip(payload: PlanTripRequest): Promise<PlanTripResponse> {
  const response = await fetch(`${API_BASE_URL}/plan-trip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error("Failed to plan trip");
  }
  return response.json();
}

type RoutePayload = {
  source: string;
  destination: string;
  waypoints?: string[];
};

type PlacesPayload = {
  location: string;
  interests?: string[];
  budget?: "low" | "medium" | "high";
};

function normalizeFastApiDetail(detail: unknown): string {
  if (detail == null) return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "object" && item !== null && "msg" in item) {
          return String((item as { msg?: string }).msg ?? "");
        }
        return typeof item === "string" ? item : JSON.stringify(item);
      })
      .filter(Boolean)
      .join("; ");
  }
  if (typeof detail === "object") {
    return JSON.stringify(detail);
  }
  return String(detail);
}

async function parseError(response: Response, fallback: string) {
  let detail = fallback;
  try {
    const payload = await response.json();
    const raw = payload?.detail;
    const normalized = normalizeFastApiDetail(raw);
    if (normalized) {
      detail = normalized;
    }
  } catch {
    // keep fallback
  }
  return detail;
}

export async function optimizeRoute(payload: RoutePayload): Promise<RouteResponse> {
  const response = await fetch(`${API_BASE_URL}/optimize-route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: payload.source,
      destination: payload.destination,
      waypoints: payload.waypoints ?? []
    })
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to optimize route"));
  }
  return response.json();
}

export async function recommendPlaces(payload: PlacesPayload): Promise<PlacesResponse> {
  const response = await fetch(`${API_BASE_URL}/recommend-places`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: payload.location,
      interests: payload.interests ?? [],
      budget: payload.budget ?? "medium"
    })
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to recommend places"));
  }
  return response.json();
}

export async function getWeather(source: string, destination: string): Promise<WeatherResponse> {
  const params = new URLSearchParams({ source, destination });
  const response = await fetch(`${API_BASE_URL}/weather?${params.toString()}`);
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to fetch weather"));
  }
  return response.json();
}

export async function streamChatReply(message: string, onChunk: (chunk: string) => void) {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, stream: true })
  });
  if (!response.ok || !response.body) {
    throw new Error(await parseError(response, "Failed to stream chat response"));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}
