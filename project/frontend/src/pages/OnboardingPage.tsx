import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useExpertiseStore } from "../stores/expertiseStore";
import { ExpertiseLevel } from "../types";

const OPTIONS: { level: ExpertiseLevel; title: string; body: string }[] = [
  { level: "BEGINNER", title: "Beginner", body: "I'm new to ML/DL. Guide me through everything." },
  { level: "INTERMEDIATE", title: "Intermediate", body: "I know the basics and want some control." },
  { level: "EXPERT", title: "Expert", body: "I'm experienced. Give me full technical control." },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const setLevel = useExpertiseStore((s) => s.setLevel);

  async function choose(level: ExpertiseLevel) {
    await api.patch("/users/me/expertise-level", { expertise_level: level });
    setLevel(level);
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-950 text-base-100 px-6">
      <div className="max-w-2xl w-full text-center">
        <h1 className="font-display text-2xl font-semibold mb-2">What is your ML/DL experience?</h1>
        <p className="text-base-100/60 mb-8 text-sm">
          This just sets your starting view — you can change it any time from Settings.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {OPTIONS.map((opt) => (
            <button
              key={opt.level}
              onClick={() => choose(opt.level)}
              className="rounded-lg border border-base-800 bg-base-900 p-5 text-left hover:border-accent transition-colors"
            >
              <div className="font-medium mb-1">{opt.title}</div>
              <div className="text-sm text-base-100/60">{opt.body}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
