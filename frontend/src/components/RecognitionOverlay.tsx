export default function RecognitionOverlay({ result }: { result: any }) {
  if (!result) return null;
  return (
    <div className="card p-6 mt-4">
      <h3 className="text-xl font-semibold mb-2">Gedetecteerde kaarten</h3>
      <ul className="space-y-2">
        {result.cards?.map((c: any, i: number) => (
          <li key={i} className="flex items-center justify-between">
            <span>
              {c.name} {c.orientation ? `(${c.orientation})` : ''}
            </span>
            <span className="text-sm opacity-70">
              {(c.confidence * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

