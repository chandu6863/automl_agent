import { useExpertiseStore } from "../stores/expertiseStore";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const level = useExpertiseStore((s) => s.level);

  if (level === "BEGINNER") {
    return (
      <div className="max-w-3xl">
        <p className="eyebrow mb-3">Guided mode</p>
        <h1 className="font-display mb-2 text-3xl font-semibold">What would you like to predict?</h1>
        <p className="mb-8 text-base-100/60">Start with a dataset and a question. The workspace will handle the technical setup.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[['Analyze Dataset', '/datasets', 'Upload a file and inspect its shape.'], ['Build Model', '/models', 'Compare baseline models with guidance.'], ['Explain Results', '/experiments', 'Review completed runs and metrics.']].map(([label, to, description]) => (
            <Link key={label} to={to} className="surface rounded-md p-5 text-left transition hover:-translate-y-1 hover:border-accent">
              <div className="font-medium">{label}</div>
              <div className="mt-2 text-sm leading-5 text-base-100/50">{description}</div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (level === "INTERMEDIATE") {
    return (
      <div>
        <p className="eyebrow mb-3">Assisted mode</p>
        <h1 className="font-display mb-6 text-3xl font-semibold">Dashboard</h1>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="surface rounded-md p-5">
            <h3 className="font-medium mb-3">Dataset Statistics</h3>
            <p className="text-sm text-base-100/60">Upload a dataset to see profiling, missing values, and class balance here.</p>
          </div>
          <div className="surface rounded-md p-5">
            <h3 className="font-medium mb-3">Model Recommendations</h3>
            <p className="text-sm text-base-100/60">Run an experiment to see candidate models and reasoning.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow mb-3">Expert mode</p>
      <h1 className="font-display mb-6 text-3xl font-semibold">Expert Dashboard</h1>
      <div className="grid gap-5 md:grid-cols-3">
        <div className="surface rounded-md p-5">
          <h3 className="font-medium mb-3">Pipeline Configuration</h3>
          <p className="text-sm text-base-100/60">Preprocessing, feature engineering, model search space.</p>
        </div>
        <div className="surface rounded-md p-5">
          <h3 className="font-medium mb-3">HPO Trials</h3>
          <p className="text-sm text-base-100/60">Optuna trial history and search diagnostics.</p>
        </div>
        <div className="surface rounded-md p-5">
          <h3 className="font-medium mb-3">Experiment Logs</h3>
          <p className="text-sm text-base-100/60">Full technical logs and cross-validation detail.</p>
        </div>
      </div>
    </div>
  );
}
