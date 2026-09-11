import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";

interface DatasetProfile {
  row_count: number;
  column_count: number;
  numerical_columns: string[];
  categorical_columns: string[];
  duplicate_rows: number;
  missing_by_column: Record<string, { count: number; pct: number }>;
  candidate_target_columns: string[];
  column_dtypes: Record<string, string>;
}

interface DatasetDetail {
  id: string;
  name: string;
  target_column: string | null;
  task_type: string | null;
  current_version: number | null;
  sha256_hash: string | null;
  profile: DatasetProfile | null;
}

interface VerificationResult {
  verified: boolean;
  registered_hash: string;
  current_hash: string;
  note: string;
}

export default function DatasetDetailPage() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const [dataset, setDataset] = useState<DatasetDetail | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!datasetId) return;
    api.get<DatasetDetail>(`/datasets/${datasetId}`)
      .then(({ data }) => setDataset(data))
      .catch((err: any) => setError(err?.response?.data?.detail ?? "Could not load this dataset."))
      .finally(() => setLoading(false));
  }, [datasetId]);

  async function verifyDataset() {
    if (!datasetId) return;
    setVerifying(true);
    setError(null);
    try {
      const { data } = await api.post<VerificationResult>(`/datasets/${datasetId}/verify`);
      setVerification(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Verification failed.");
    } finally {
      setVerifying(false);
    }
  }

  if (loading) return <div className="text-sm text-base-100/60">Loading dataset...</div>;
  if (!dataset) return <div className="text-sm text-status-failed">{error ?? "Dataset not found."}</div>;

  const profile = dataset.profile;
  const missingColumns = Object.entries(profile?.missing_by_column ?? {});

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/datasets" className="text-sm text-accent hover:text-accent-muted">← Back to datasets</Link>
          <p className="eyebrow mb-2 mt-6">Dataset profile</p>
          <h1 className="font-display text-3xl font-semibold">{dataset.name}</h1>
          <p className="mt-2 text-sm text-base-100/55">Version {dataset.current_version ?? "-"} · {dataset.task_type ?? "Task not selected"}</p>
        </div>
        <button type="button" onClick={verifyDataset} disabled={verifying} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base-950 transition hover:bg-accent-muted disabled:opacity-50">
          {verifying ? "Verifying..." : "Verify integrity"}
        </button>
      </div>

      {error && <div className="rounded-md bg-status-failed/10 px-4 py-3 text-sm text-status-failed">{error}</div>}
      {verification && (
        <div className={`rounded-md px-4 py-3 text-sm ${verification.verified ? "bg-status-verified/10 text-status-verified" : "bg-status-failed/10 text-status-failed"}`}>
          {verification.verified ? "Integrity verified." : "Integrity mismatch detected."} {verification.note}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[["Rows", profile?.row_count ?? "-"], ["Columns", profile?.column_count ?? "-"], ["Duplicate rows", profile?.duplicate_rows ?? "-"]].map(([label, value]) => (
          <div key={label} className="surface rounded-md p-5">
            <p className="text-sm text-base-100/55">{label}</p>
            <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <section className="surface rounded-md p-6">
        <p className="eyebrow mb-4">Integrity record</p>
        <p className="break-all font-mono text-xs leading-6 text-base-100/65">{dataset.sha256_hash ?? "No hash available"}</p>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><span className="text-base-100/45">Target candidates:</span> {profile?.candidate_target_columns.join(", ") || "None detected"}</div>
          <div><span className="text-base-100/45">Selected target:</span> {dataset.target_column ?? "Not selected"}</div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="surface rounded-md p-6">
          <p className="eyebrow mb-4">Missing values</p>
          {missingColumns.length === 0 ? <p className="text-sm text-status-verified">No missing values detected.</p> : (
            <div className="space-y-3">{missingColumns.map(([column, value]) => (
              <div key={column} className="flex items-center justify-between text-sm"><span>{column}</span><span className="text-base-100/55">{value.count} ({value.pct}%)</span></div>
            ))}</div>
          )}
        </div>
        <div className="surface rounded-md p-6">
          <p className="eyebrow mb-4">Column types</p>
          <div className="max-h-48 space-y-3 overflow-y-auto">{Object.entries(profile?.column_dtypes ?? {}).map(([column, dtype]) => (
            <div key={column} className="flex items-center justify-between text-sm"><span>{column}</span><span className="font-mono text-xs text-accent">{dtype}</span></div>
          ))}</div>
        </div>
      </section>
    </div>
  );
}