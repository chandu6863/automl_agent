import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

interface ModelResult {
  name: string;
  metrics: Record<string, number>;
}

interface ExperimentIteration {
  step_name: string;
  status: string;
}

interface Experiment {
  id: string;
  task_type: string;
  target_column: string;
  status: string;
  started_at: string;
  best_model: string | null;
  models: ModelResult[];
  iterations: ExperimentIteration[];
}

function metricSummary(metrics: Record<string, number>) {
  return Object.entries(metrics).map(([key, value]) => `${key}: ${value}`).join(" · ");
}

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Experiment[]>("/automl/experiments")
      .then(({ data }) => setExperiments(data))
      .catch(() => setError("Could not load experiments."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">Phase 7 · Reproducibility</p>
          <h1 className="font-display text-3xl font-semibold">Experiments</h1>
          <p className="mt-2 text-base-100/60">Review completed runs and compare the models evaluated for each target.</p>
        </div>
        <Link to="/models" className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base-950 transition hover:bg-accent-muted">New experiment</Link>
      </div>

      {error && <div className="rounded-md bg-status-failed/10 px-4 py-3 text-sm text-status-failed">{error}</div>}
      {loading && <p className="text-sm text-base-100/55">Loading experiment history...</p>}
      {!loading && experiments.length === 0 && <div className="rounded-md border border-dashed border-base-800 p-10 text-center text-sm text-base-100/50">No experiments have been run yet.</div>}
      <div className="space-y-4">
        {experiments.map((experiment) => (
          <article key={experiment.id} className="surface rounded-md p-5">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <p className="font-medium">{experiment.best_model ?? "Experiment run"}</p>
                <p className="mt-1 text-sm text-base-100/50">{experiment.task_type} · target: {experiment.target_column}</p>
              </div>
              <div className="text-right"><span className="text-xs font-semibold text-status-verified">{experiment.status}</span><p className="mt-1 text-xs text-base-100/40">{new Date(experiment.started_at).toLocaleString()}</p></div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {experiment.models.map((model) => <div key={model.name} className={`rounded-md border p-4 ${model.name === experiment.best_model ? "border-accent/60 bg-accent/5" : "border-base-800 bg-base-950/40"}`}><div className="flex flex-wrap justify-between gap-2 text-sm"><span>{model.name}</span>{model.name === experiment.best_model && <span className="text-xs text-accent">Best result</span>}</div><p className="mt-2 text-xs text-base-100/55">{metricSummary(model.metrics)}</p></div>)}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {experiment.iterations.map((iteration) => <span key={iteration.step_name} className="rounded-full border border-status-verified/30 bg-status-verified/10 px-2.5 py-1 text-xs text-status-verified">{iteration.step_name.replace(/_/g, " ")} · {iteration.status}</span>)}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}