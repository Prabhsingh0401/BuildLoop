export default function PriorityBadge({ score }) {
  let label = 'Low';
  if (score >= 67) label = 'High';
  else if (score >= 34) label = 'Medium';

  return (
    <span className="text-[10px] font-bold text-ink-2 bg-ink/5 border border-ink/10 px-2 py-0.5 rounded-pill inline-flex items-center gap-1.5 uppercase">
      {score} {label}
    </span>
  );
}
