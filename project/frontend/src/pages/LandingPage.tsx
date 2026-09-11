import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const PIPELINE_STAGES = ["User", "AI Agent", "Expertise Level", "AutoML Engine", "Secure Dataset", "Blockchain Ledger", "ML Results"];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-base-950 text-base-100">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <span className="font-display text-lg font-semibold tracking-tight">AutoML<span className="text-accent">/</span>Agent</span>
        <div className="flex gap-3">
          <Link to="/login" className="px-4 py-2 text-sm rounded-md hover:bg-base-900">
            Log in
          </Link>
          <Link to="/signup" className="px-4 py-2 text-sm rounded-md bg-accent text-white hover:bg-accent-muted">
            Sign up
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-10 lg:pt-28">
        <div className="max-w-4xl">
          <p className="eyebrow mb-6">Secure machine learning workspace</p>
          <h1 className="font-display text-5xl font-semibold leading-[0.98] tracking-tight sm:text-7xl">
            Intelligent AutoML.<br /><span className="text-accent">Adapted to you.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-base-100/65">
            An AI-powered machine learning workspace that adapts to your expertise while keeping your
            datasets verifiable, secure, and traceable.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link to="/signup" className="rounded-md bg-accent px-6 py-3 font-semibold text-base-950 transition hover:bg-accent-muted">
              Start building <span aria-hidden="true">↗</span>
            </Link>
            <a href="#how-it-works" className="rounded-md border border-base-800 px-6 py-3 font-medium transition hover:border-accent/60 hover:bg-base-900">
              Explore the workflow
            </a>
          </div>
        </div>
        <div className="mt-20 grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-base-800 bg-base-800 sm:grid-cols-4">
          {[['01', 'Upload'], ['02', 'Profile'], ['03', 'Train'], ['04', 'Verify']].map(([number, label]) => (
            <div key={number} className="bg-base-900 px-5 py-4">
              <div className="text-xs text-base-100/40">{number}</div>
              <div className="mt-2 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {PIPELINE_STAGES.map((stage, i) => (
            <div key={stage} className="flex items-center gap-3">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-md border border-base-800 bg-base-900 px-4 py-3 text-sm font-medium shadow-lift"
              >
                {stage}
              </motion.div>
              {i < PIPELINE_STAGES.length - 1 && <span className="text-base-100/30">→</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 pb-24 md:grid-cols-3 lg:px-10">
        {[
          { title: "Three Expertise Levels", body: "Guided for beginners, assisted for practitioners, full control for experts — one shared engine underneath." },
          { title: "Secure Dataset Verification", body: "Every dataset is hashed and its integrity is checked against a tamper-evident ledger record." },
          { title: "Blockchain Ledger", body: "Dataset registration, verification, and version history — transparent and auditable." },
        ].map((card) => (
          <div key={card.title} className="surface rounded-md p-6">
            <h3 className="font-medium mb-2">{card.title}</h3>
            <p className="text-sm text-base-100/60">{card.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-base-800 px-8 py-8 text-sm text-base-100/50 text-center">
        Built as a B.Tech CSE final-year research project. Anyone can use ML. Experts can control ML. Every dataset can be verified.
      </footer>
    </div>
  );
}
