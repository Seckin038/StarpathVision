export default function WhyPanel({
  explanation,
}: {
  explanation?: { summary: string; full: string };
}) {
  if (!explanation) return null;
  return (
    <div className="card p-6 mt-4">
      <h3 className="text-xl font-semibold mb-2">Waarom – Uitleg</h3>
      <p className="font-medium mb-2">{explanation.summary}</p>
      <p className="opacity-90 whitespace-pre-wrap">{explanation.full}</p>
    </div>
  );
}

