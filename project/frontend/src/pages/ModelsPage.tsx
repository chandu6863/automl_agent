import { useEffect, useState } from "react";
import { api } from "../services/api";

interface Dataset { id: string; name: string; }
interface Model { name: string; metrics: Record<string, number>; }
interface Experiment { id: string; task_type: string; target_column: string; status: string; best_model: string | null; models: Model[]; }

export default function ModelsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [datasetId, setDatasetId] = useState("");
  const [target, setTarget] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [datasetResponse, experimentResponse] = await Promise.all([api.get<Dataset[]>("/datasets"), api.get<Experiment[]>("/automl/experiments")]);
    setDatasets(datasetResponse.data);
    setExperiments(experimentResponse.data);
    if (!datasetId && datasetResponse.data[0]) setDatasetId(datasetResponse.data[0].id);
  }
  useEffect(() => { load().catch(() => setError("Could not load modeling data.")); }, []);

  async function run() {
    setRunning(true); setError(null);
    try { await api.post("/automl/run", { dataset_id: datasetId, target_column: target }); await load(); setTarget(""); }
    catch (err: any) { setError(err?.response?.data?.detail ?? "AutoML run failed."); }
    finally { setRunning(false); }
  }

  return <div className="max-w-5xl space-y-6">
    <div><p className="eyebrow mb-3">Phase 6 · AutoML engine</p><h1 className="font-display text-3xl font-semibold">Models</h1><p className="mt-2 text-base-100/60">Run reproducible baseline comparisons against an uploaded dataset.</p></div>
    <section className="surface rounded-md p-6"><p className="eyebrow mb-4">New experiment</p><div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"><select value={datasetId} onChange={(event) => setDatasetId(event.target.value)} className="rounded-md border border-base-800 bg-base-950 px-3 py-2 text-sm"><option value="">Select dataset</option>{datasets.map((dataset) => <option key={dataset.id} value={dataset.id}>{dataset.name}</option>)}</select><input value={target} onChange={(event) => setTarget(event.target.value)} placeholder="Target column, e.g. churn" className="rounded-md border border-base-800 bg-base-950 px-3 py-2 text-sm outline-none focus:border-accent" /><button type="button" onClick={run} disabled={running || !datasetId || !target.trim()} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base-950 disabled:opacity-40">{running ? "Running..." : "Run AutoML"}</button></div>{error && <p className="mt-3 text-sm text-status-failed">{error}</p>}</section>
    {experiments.length === 0 ? <div className="rounded-md border border-dashed border-base-800 p-10 text-center text-sm text-base-100/50">No experiments yet. Select a dataset and target to compare baseline models.</div> : <div className="space-y-4">{experiments.map((experiment) => <section key={experiment.id} className="surface rounded-md p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-medium">{experiment.best_model ?? "Experiment"}</p><p className="mt-1 text-sm text-base-100/50">{experiment.task_type} · target: {experiment.target_column}</p></div><span className="text-xs text-status-verified">{experiment.status}</span></div><div className="mt-4 grid gap-3 md:grid-cols-2">{experiment.models.map((model) => <div key={model.name} className="rounded-md border border-base-800 bg-base-950/50 p-3"><div className="flex justify-between text-sm"><span>{model.name}</span><span className="text-accent">{Object.entries(model.metrics).map(([key, value]) => `${key}: ${value}`).join(" · ")}</span></div></div>)}</div></section>)}</div>}
  </div>;
}