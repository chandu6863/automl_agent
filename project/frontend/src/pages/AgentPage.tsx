import { FormEvent, useState } from "react";
import { api } from "../services/api";
import { useExpertiseStore } from "../stores/expertiseStore";

interface AgentResponse {
  reply: string;
  intent: string;
  suggestions: string[];
  dataset_count: number;
}

interface ChatMessage {
  role: "user" | "agent";
  text: string;
}

const STARTERS = ["Profile my datasets", "Help me build a model", "Verify dataset integrity"];

export default function AgentPage() {
  const level = useExpertiseStore((state) => state.level);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "agent", text: "I’m ready to help you inspect data, prepare a model, or verify dataset integrity. What should we work on?" },
  ]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState(STARTERS);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(event?: FormEvent, text = input) {
    event?.preventDefault();
    const message = text.trim();
    if (!message || sending) return;
    setInput("");
    setError(null);
    setMessages((current) => [...current, { role: "user", text: message }]);
    setSending(true);
    try {
      const { data } = await api.post<AgentResponse>("/agent/message", { message });
      setMessages((current) => [...current, { role: "agent", text: data.reply }]);
      setSuggestions(data.suggestions);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "The agent could not respond. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-7rem)] gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="surface flex min-h-[620px] flex-col rounded-md">
        <header className="border-b border-base-800 px-6 py-5">
          <p className="eyebrow mb-2">Phase 5 · Agent workspace</p>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h1 className="font-display text-2xl font-semibold">AI Agent</h1><p className="mt-1 text-sm text-base-100/55">Guided by your Level {level === "BEGINNER" ? "1" : level === "INTERMEDIATE" ? "2" : "3"} workspace mode.</p></div>
            <span className="rounded-full border border-base-800 px-3 py-1 text-xs text-accent">Deterministic preview</span>
          </div>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-md px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-accent text-base-950" : "bg-base-950 text-base-100/80"}`}>{message.text}</div></div>)}
          {sending && <div className="text-sm text-base-100/45">Agent is thinking...</div>}
        </div>
        {error && <div className="mx-6 mb-3 rounded-md bg-status-failed/10 px-3 py-2 text-sm text-status-failed">{error}</div>}
        <form onSubmit={sendMessage} className="border-t border-base-800 p-4">
          <div className="flex gap-3"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about a dataset or modeling workflow..." className="min-w-0 flex-1 rounded-md border border-base-800 bg-base-950 px-4 py-3 text-sm outline-none focus:border-accent" /><button type="submit" disabled={sending || !input.trim()} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base-950 disabled:opacity-40">Send</button></div>
        </form>
      </section>
      <aside className="space-y-5">
        <div className="surface rounded-md p-5"><p className="eyebrow mb-4">Try asking</p><div className="space-y-2">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => sendMessage(undefined, suggestion)} className="w-full rounded-md border border-base-800 px-3 py-2 text-left text-sm text-base-100/70 transition hover:border-accent hover:text-base-100">{suggestion}</button>)}</div></div>
        <div className="surface rounded-md p-5"><p className="eyebrow mb-3">What it knows</p><p className="text-sm leading-6 text-base-100/55">Your agent can inspect the datasets attached to your account and explain the next step without changing or retraining anything.</p></div>
      </aside>
    </div>
  );
}