import json
import re

from google import genai

from app.core.config import settings


def _strip_json_fence(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*", "", t, flags=re.IGNORECASE)
        t = re.sub(r"\s*```$", "", t)
    return t.strip()


def _gemini_error_message(exc: Exception) -> str:
    msg = str(exc).lower()
    if "429" in msg or "quota" in msg or "resource exhausted" in msg:
        return "Gemini quota exceeded. Check billing or try again later."
    return f"Gemini request failed: {exc}"


def _llm_provider_resolved() -> str:
    p = (settings.llm_provider or "auto").strip().lower()
    if p == "auto":
        if settings.gemini_api_key:
            return "gemini"
        if settings.openai_api_key:
            return "openai"
        return "gemini"
    return p


class LLMService:
    def __init__(self) -> None:
        self._provider = _llm_provider_resolved()
        self.model_name = settings.gemini_model or "gemini-2.5-flash"
        self.openai_model = settings.openai_model or "gpt-4o-mini"
        self._gemini_client = (
            genai.Client(api_key=settings.gemini_api_key) if settings.gemini_api_key else None
        )
        self._openai_client = None
        if settings.openai_api_key:
            try:
                from openai import OpenAI

                kwargs = {"api_key": settings.openai_api_key}
                if settings.openai_base_url:
                    kwargs["base_url"] = settings.openai_base_url
                self._openai_client = OpenAI(**kwargs)
            except ImportError as exc:
                raise RuntimeError(
                    "OPENAI_API_KEY is set but the openai package is not installed. Run: pip install openai"
                ) from exc

    def _require_gemini(self) -> None:
        if self._gemini_client is None:
            raise RuntimeError(
                "GEMINI_API_KEY is missing. Add it, or set LLM_PROVIDER=openai with OPENAI_API_KEY."
            )

    def _require_openai(self) -> None:
        if self._openai_client is None:
            raise RuntimeError(
                "OPENAI_API_KEY is missing. Add it, or set LLM_PROVIDER=gemini with GEMINI_API_KEY."
            )

    def itinerary(self, source: str, destination: str, days: int, preferences: dict) -> dict:
        prov = self._provider
        if prov == "openai":
            return self._itinerary_openai(source, destination, days, preferences)
        self._require_gemini()
        return self._itinerary_gemini(source, destination, days, preferences)

    def _itinerary_gemini(self, source: str, destination: str, days: int, preferences: dict) -> dict:
        prompt = (
            "Return ONLY valid JSON (no markdown fences) for a road trip plan with exactly these keys: "
            '"summary" (string), "estimated_budget" (number in INR), "itinerary" (array of objects, each with '
            '"day" (integer 1..N), "title" (string), "activities" (array of strings), "stay" (string)). '
            f"Trip: {source} to {destination}, days={days}, preferences={json.dumps(preferences)}."
        )
        try:
            response = self._gemini_client.models.generate_content(model=self.model_name, contents=prompt)
        except Exception as exc:
            raise RuntimeError(_gemini_error_message(exc)) from exc

        text = (response.text or "").strip()
        if not text:
            raise RuntimeError("Gemini returned an empty response.")

        try:
            data = json.loads(_strip_json_fence(text))
        except json.JSONDecodeError as exc:
            raise RuntimeError("Gemini did not return valid JSON for the itinerary.") from exc

        if not isinstance(data.get("itinerary"), list):
            raise RuntimeError("Invalid itinerary shape from Gemini.")
        return data

    def _itinerary_openai(self, source: str, destination: str, days: int, preferences: dict) -> dict:
        self._require_openai()
        prompt = (
            "Return ONLY valid JSON for a road trip plan with keys summary (string), estimated_budget (number INR), "
            "itinerary (array of objects with day, title, activities array, stay). "
            f"Trip: {source} to {destination}, days={days}, preferences={json.dumps(preferences)}."
        )
        try:
            response = self._openai_client.chat.completions.create(
                model=self.openai_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                response_format={"type": "json_object"},
            )
        except Exception as exc:
            raise RuntimeError(f"OpenAI itinerary failed: {exc}") from exc

        text = (response.choices[0].message.content or "").strip()
        if not text:
            raise RuntimeError("OpenAI returned an empty response.")
        try:
            data = json.loads(text)
        except json.JSONDecodeError as exc:
            raise RuntimeError("OpenAI did not return valid JSON for the itinerary.") from exc
        if not isinstance(data.get("itinerary"), list):
            raise RuntimeError("Invalid itinerary shape from OpenAI.")
        return data

    def chat_reply(self, message: str) -> str:
        prov = self._provider
        if prov == "openai":
            self._require_openai()
            try:
                response = self._openai_client.chat.completions.create(
                    model=self.openai_model,
                    messages=[{"role": "user", "content": message}],
                    temperature=0.6,
                )
            except Exception as exc:
                raise RuntimeError(f"OpenAI chat failed: {exc}") from exc
            return (response.choices[0].message.content or "").strip() or "Let's build your route."

        self._require_gemini()
        try:
            response = self._gemini_client.models.generate_content(model=self.model_name, contents=message)
        except Exception as exc:
            raise RuntimeError(_gemini_error_message(exc)) from exc

        return (response.text or "").strip() or "Let's build your route."

    def chat_reply_stream(self, message: str):
        prov = self._provider
        if prov == "openai":
            self._require_openai()
            try:
                stream = self._openai_client.chat.completions.create(
                    model=self.openai_model,
                    messages=[{"role": "user", "content": message}],
                    temperature=0.6,
                    stream=True,
                )
            except Exception as exc:
                raise RuntimeError(f"OpenAI chat failed: {exc}") from exc

            try:
                for chunk in stream:
                    if not chunk.choices:
                        continue
                    delta = chunk.choices[0].delta
                    piece = getattr(delta, "content", None) if delta else None
                    if piece:
                        yield piece
            except Exception as exc:
                yield "\n\n[OpenAI stream error: " + str(exc) + "]"
            return

        self._require_gemini()
        try:
            stream = self._gemini_client.models.generate_content_stream(model=self.model_name, contents=message)
        except Exception as exc:
            raise RuntimeError(_gemini_error_message(exc)) from exc

        try:
            for chunk in stream:
                if chunk.text:
                    yield chunk.text
        except Exception as exc:
            yield "\n\n[" + _gemini_error_message(exc) + "]"
