export type TripPreferences = {
  budget?: "low" | "medium" | "high";
  interests?: string[];
  transport?: "car" | "bike" | "ev";
};

export type PlanTripRequest = {
  source: string;
  destination: string;
  days: number;
  preferences?: TripPreferences;
};

export type PlanTripResponse = {
  summary: string;
  estimated_budget: number;
  itinerary: Array<{
    day: number;
    title: string;
    activities: string[];
    stay: string;
  }>;
};

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export type DirectionStep = {
  step?: number;
  text: string;
  distance_m?: number | null;
  duration_s?: number | null;
};

export type RouteResponse = {
  provider: string;
  steps?: DirectionStep[];
  raw: {
    routes?: Array<{
      overview_polyline?: { points?: string };
      /** OpenRouteService / non-Google: [lng, lat][] */
      coordinates_lnglat?: [number, number][];
      legs?: Array<{
        distance?: { text?: string; value?: number };
        duration?: { text?: string; value?: number };
        start_location?: { lat?: number; lng?: number };
        end_location?: { lat?: number; lng?: number };
      }>;
    }>;
    status?: string;
  };
};

export type PlacesResponse = {
  provider: string;
  location: string;
  budget: "low" | "medium" | "high";
  interests: string[];
  recommendations: Array<{
    name?: string;
    address?: string;
    rating?: number;
    types?: string[];
  }>;
};

export type WeatherPoint = {
  city: string;
  timestamp?: string;
  temperature_c?: number;
  condition?: string;
};

export type WeatherResponse = {
  provider: string;
  source: string;
  destination: string;
  source_forecast: WeatherPoint[];
  destination_forecast: WeatherPoint[];
};
