interface Props {
  title: string;
  phase: string;
}

export default function PlaceholderPage({ title, phase }: Props) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-2">{title}</h1>
      <p className="text-base-100/60 text-sm">This section is built in {phase} of the roadmap.</p>
    </div>
  );
}
