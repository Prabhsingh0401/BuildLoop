export default function PriorityBadge({ score }) {
  let bgClass    = 'bg-danger-light';
  let textColor  = '#B91C1C';
  let label      = 'Low';

  if (score >= 67) {
    bgClass   = 'bg-success-light';
    textColor = '#0A7D5A';
    label     = 'High';
  } else if (score >= 34) {
    bgClass   = 'bg-warn-light';
    textColor = '#92510E';
    label     = 'Medium';
  }

  return (
    <span
      className={`${bgClass} text-[11px] font-semibold
                  px-2 py-0.5 rounded-pill inline-flex
                  items-center gap-1`}
      style={{ color: textColor }}
    >
      {score}
      <span className="opacity-70">{label}</span>
    </span>
  );
}
