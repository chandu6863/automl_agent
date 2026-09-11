import { ChangeEvent, useEffect, useState } from "react";
import { api } from "../services/api";
import { DatasetUploadResult } from "../types";
import { Link } from "react-router-dom";

interface DatasetListItem {
  id: string;
  name: string;
  task_type: string;
  target_column: string | null;
  created_at: string;
}

export default function DatasetsPage() {
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Datasets</h1>
        <label className="rounded-md bg-accent text-white px-4 py-2 text-sm font-medium cursor-pointer hover:bg-accent-muted">
          {uploading ? "Uploading..." : "Upload dataset"}
          <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

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

      {datasets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-base-800 p-10 text-center text-sm text-base-100/50">
          No datasets yet. Upload a CSV or Excel file to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {datasets.map((d) => (
            <Link to={`/datasets/${d.id}`} key={d.id} className="surface flex justify-between rounded-md p-4 transition hover:border-accent">
              <span className="font-medium">{d.name}</span>
              <span className="text-sm text-base-100/50">{d.task_type}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
