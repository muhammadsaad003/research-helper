// A tiny SVG bar chart (no chart library needed). Works in server components.
export default function BarChart({ data, label, height = 140 }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barW = 100 / data.length;
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <figure>
      <svg viewBox={`0 0 100 ${height / 2}`} preserveAspectRatio="none" className="h-36 w-full" role="img" aria-label={`${label}: ${total} in the last ${data.length} days`}>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2="100" y1={(height / 2) * f} y2={(height / 2) * f} stroke="rgb(var(--line))" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
        ))}
        {data.map((d, i) => {
          const h = (d.value / max) * (height / 2 - 4);
          return (
            <rect key={d.label} x={i * barW + barW * 0.18} y={height / 2 - h} width={barW * 0.64} height={Math.max(h, d.value ? 1 : 0)} rx="0.6" fill="rgb(var(--ink))" opacity={i === data.length - 1 ? 1 : 0.55}>
              <title>{`${d.label}: ${d.value}`}</title>
            </rect>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex justify-between text-xs text-soft">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </figcaption>
    </figure>
  );
}
