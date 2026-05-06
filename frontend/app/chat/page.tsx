"use client";

import { useMemo, useState } from "react";
import { Mic, SendHorizontal, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { streamChatReply } from "@/lib/api-client";
import { ChatMessage } from "@/lib/types";

const suggestions = ["Scenic route to Goa", "EV-friendly Bengaluru to Coorg", "Budget family trip in 3 days"];
type SpeechResultEvent = {
  results?: ArrayLike<ArrayLike<{ transcript?: string }>>;
};

type SpeechRecognitionCtor = new () => {
  lang: string;
  onresult: ((event: SpeechResultEvent) => void) | null;
  start: () => void;
};

export default function ChatPage() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Where are you starting from, and what is your trip style?" }
  ]);

  const supportsSpeech = useMemo(
    () => typeof window !== "undefined" && "webkitSpeechRecognition" in window,
    []
  );

  const onVoiceInput = () => {
    if (!supportsSpeech) return;
    const SpeechRecognition = (window as Window & { webkitSpeechRecognition?: SpeechRecognitionCtor })
      .webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.onresult = (event: SpeechResultEvent) => {
      setValue(event.results?.[0]?.[0]?.transcript ?? "");
    };
    recognition.start();
  };

  const onSend = async (nextPrompt?: string) => {
    const prompt = (nextPrompt ?? value).trim();
    if (!prompt || loading) return;

    setValue("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: prompt }, { role: "assistant", text: "" }]);

    try {
      await streamChatReply(prompt, (chunk) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = { ...last, text: `${last.text}${chunk}` };
          return updated;
        });
      });
    } catch (error) {
      const detail =
        error instanceof Error && error.message ? error.message : "I could not reach the AI backend.";
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          text: detail
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Gemini travel copilot</h1>
        <p className="text-sm text-slate-400">Streaming replies from your backend (Gemini).</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "assistant"
                    ? "border border-white/10 bg-white/[0.04] text-slate-100"
                    : "ml-auto border border-sky-500/20 bg-sky-500/10 text-slate-100"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && <p className="text-xs text-sky-400/90">Generating…</p>}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 p-2">
            <button
              type="button"
              className="rounded-md p-2 transition hover:bg-white/10 disabled:opacity-40"
              aria-label="Voice input"
              onClick={onVoiceInput}
              disabled={!supportsSpeech}
            >
              <Mic className="h-4 w-4 text-sky-400" />
            </button>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ask for routes, stops, weather, or budget plans…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") onSend();
              }}
            />
            <Button size="sm" onClick={() => onSend()}>
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <aside className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-sky-200">
            <WandSparkles className="h-4 w-4" />
            Starters
          </h2>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] p-3 text-left text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/[0.06]"
                onClick={() => onSend(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
