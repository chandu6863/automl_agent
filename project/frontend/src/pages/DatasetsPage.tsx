import { ChangeEvent, useEffect, useState } from "react";
import { api } from "../services/api";
import { DatasetUploadResult } from "../types";
import { Link } from "react-router-dom";
import { useExpertiseStore } from "../stores/expertiseStore";

interface DatasetListItem {
  id: string;
  name: string;
  task_type: string;
  target_column: string | null;
  created_at: string;
}

export default function DatasetsPage() {
  const level = useExpertiseStore((state) => state.level);
  const [datasets, setDatasets] = useState<DatasetListItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [lastResult, setLastResult] = useState<DatasetUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadDatasets() {
    const { data } = await api.get<DatasetListItem[]>("/datasets");
    setDatasets(data);
  }

  useEffect(() => {
    loadDatasets();
  }, []);

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post<DatasetUploadResult>("/datasets/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setLastResult(data);
      await loadDatasets();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Data workspace</p>
          <h1 className="font-display text-3xl font-semibold">Datasets</h1>
          <p className="mt-2 text-sm text-base-100/55">{level === "BEGINNER" ? "Start with one file. We will show you what it contains." : level === "INTERMEDIATE" ? "Inspect quality signals before choosing a modeling target." : "Review dataset versions, hashes, and profiling metadata."}</p>
        </div>
        <label className="cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base-950 transition hover:bg-accent-muted">
          {uploading ? "Uploading..." : "Upload dataset"}
          <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      <label className="surface block cursor-pointer rounded-md border-dashed p-6 transition hover:border-accent sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-medium">Drop a CSV or Excel file here</p>
            <p className="mt-1 text-sm text-base-100/50">Files are hashed, profiled, and registered before you train a model.</p>
          </div>
          <span className="rounded-md border border-base-800 px-3 py-2 text-xs font-semibold text-accent">Browse files</span>
        </div>
        <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>

      {error && <div className="mb-4 rounded-md bg-status-failed/10 text-status-failed text-sm px-3 py-2">{error}</div>}

      {lastResult && (
        <div className="mb-6 rounded-lg border border-base-800 bg-base-900 p-5">
          <h3 className="font-medium mb-2">Dataset Integrity</h3>
          <div className="text-sm text-base-100/70 space-y-1">
            <div>Dataset ID: {lastResult.dataset_id}</div>
            <div>SHA-256: {lastResult.sha256_hash.slice(0, 8)}...{lastResult.sha256_hash.slice(-6)}</div>
            <div>Rows: {lastResult.row_count} · Columns: {lastResult.column_count}</div>
            <div>Candidate targets: {lastResult.candidate_target_columns.join(", ") || "none detected"}</div>
            <div className="text-status-pending">Blockchain: {lastResult.blockchain_status} ({lastResult.note})</div>
          </div>
        </div>
      )}

      {datasets.length > 0 && <div className="grid gap-3 sm:grid-cols-3"><div className="surface rounded-md p-4"><p className="text-xs text-base-100/45">Registered datasets</p><p className="mt-1 font-display text-2xl font-semibold">{datasets.length}</p></div><div className="surface rounded-md p-4"><p className="text-xs text-base-100/45">Ready for modeling</p><p className="mt-1 font-display text-2xl font-semibold">{datasets.filter((dataset) => dataset.target_column).length}</p></div><div className="surface rounded-md p-4"><p className="text-xs text-base-100/45">Integrity status</p><p className="mt-1 font-display text-2xl font-semibold text-status-verified">Protected</p></div></div>}

      {datasets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-base-800 p-10 text-center text-sm text-base-100/50">
          No datasets yet. Upload a CSV or Excel file to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {datasets.map((d) => (
            <Link to={`/datasets/${d.id}`} key={d.id} className="surface flex flex-wrap items-center justify-between gap-3 rounded-md p-4 transition hover:border-accent">
              <div><span className="font-medium">{d.name}</span><span className="mt-1 block text-xs text-base-100/40">{d.target_column ? `Target: ${d.target_column}` : "Target not selected"}</span></div>
              <span className="rounded-full border border-base-800 px-2.5 py-1 text-xs text-base-100/55">{d.task_type ?? "UNSET"}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
