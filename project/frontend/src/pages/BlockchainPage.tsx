import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

interface DatasetSummary {
  id: string;
  name: string;
}

interface LedgerEntry {
  dataset_version_id: string;
  version_number: number;
  sha256_hash: string;
  action: string;
  chain_status: string;
  tx_hash: string | null;
  block_number: number | null;
  timestamp: string | null;
}

interface LedgerResponse {
  dataset_id: string;
  name: string;
  history: LedgerEntry[];
}

function statusClasses(status: string) {
  return status === "CONFIRMED"
    ? "bg-status-verified/10 text-status-verified"
    : status === "FAILED"
      ? "bg-status-failed/10 text-status-failed"
      : "bg-accent/10 text-accent";
}

function formatDate(timestamp: string | null) {
  if (!timestamp) return "Pending timestamp";
  return new Date(timestamp).toLocaleString();
}

export default function BlockchainPage() {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<DatasetSummary[]>("/datasets")
      .then(({ data }) => {
        setDatasets(data);
        if (data.length > 0) setSelectedDataset(data[0].id);
      })
      .catch((err: any) => setError(err?.response?.data?.detail ?? "Could not load datasets."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDataset) {
      setEntries([]);
      return;
    }
    setLoadingHistory(true);
    setError(null);
    api.get<LedgerResponse>(`/datasets/${selectedDataset}/blockchain`)
      .then(({ data }) => setEntries(data.history))
      .catch((err: any) => setError(err?.response?.data?.detail ?? "Could not load ledger history."))
      .finally(() => setLoadingHistory(false));
  }, [selectedDataset]);

  if (loading) return <div className="text-sm text-base-100/60">Loading ledger...</div>;

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <p className="eyebrow mb-2">Dataset integrity</p>
        <h1 className="font-display text-3xl font-semibold">Blockchain ledger</h1>
        <p className="mt-2 max-w-2xl text-sm text-base-100/55">
          Review the registration and verification records associated with each dataset version.
        </p>
      </div>

      {error && <div className="rounded-md bg-status-failed/10 px-4 py-3 text-sm text-status-failed">{error}</div>}

      {datasets.length === 0 ? (
        <div className="surface rounded-md p-8 text-sm text-base-100/60">
          No datasets have been registered yet. <Link to="/datasets" className="text-accent hover:text-accent-muted">Upload a dataset</Link> to create the first ledger record.
        </div>
      ) : (
        <>
          <div className="surface rounded-md p-5">
            <label htmlFor="ledger-dataset" className="eyebrow mb-3 block">Dataset</label>
            <select
              id="ledger-dataset"
              value={selectedDataset}
              onChange={(event) => setSelectedDataset(event.target.value)}
              className="w-full rounded-md border border-base-800 bg-base-950 px-3 py-2 text-sm outline-none focus:border-accent sm:max-w-xl"
            >
              {datasets.map((dataset) => <option key={dataset.id} value={dataset.id}>{dataset.name}</option>)}
            </select>
          </div>

          <section className="surface overflow-hidden rounded-md">
            <div className="flex items-center justify-between border-b border-base-800 px-5 py-4">
              <div>
                <p className="eyebrow">Ledger history</p>
                <p className="mt-1 text-sm text-base-100/55">{entries.length} record{entries.length === 1 ? "" : "s"}</p>
              </div>
              {loadingHistory && <span className="text-xs text-base-100/50">Refreshing...</span>}
            </div>
            {entries.length === 0 && !loadingHistory ? (
              <p className="px-5 py-8 text-sm text-base-100/60">No blockchain records are available for this dataset.</p>
            ) : (
              <div className="divide-y divide-base-800">
                {entries.map((entry, index) => (
                  <article key={`${entry.dataset_version_id}-${entry.action}-${entry.timestamp ?? index}`} className="space-y-3 px-5 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-accent">v{entry.version_number}</span>
                        <span className="text-sm font-semibold">{entry.action.replace(/_/g, " ")}</span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(entry.chain_status)}`}>{entry.chain_status}</span>
                      </div>
                      <time className="text-xs text-base-100/45">{formatDate(entry.timestamp)}</time>
                    </div>
                    <div className="grid gap-3 text-xs text-base-100/55 sm:grid-cols-3">
                      <div><span className="mr-2 text-base-100/35">Block</span>{entry.block_number ?? "Pending"}</div>
                      <div className="break-all sm:col-span-2"><span className="mr-2 text-base-100/35">Transaction</span>{entry.tx_hash ?? "Mock ledger record"}</div>
                    </div>
                    <div className="break-all font-mono text-[11px] leading-5 text-base-100/40">SHA-256 {entry.sha256_hash}</div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
