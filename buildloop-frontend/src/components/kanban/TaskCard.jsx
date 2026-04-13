import { ChevronRight, ChevronLeft, User, Tag } from 'lucide-react';

export default function TaskCard({
  task,
  featureName,
  onStatusMove,
  onClick,
}) {
  const STATUS_ORDER = ['todo', 'in_progress', 'done'];
  const currentIndex = STATUS_ORDER.indexOf(task.status);
  const nextStatus = currentIndex < 2
    ? STATUS_ORDER[currentIndex + 1]
    : null;
  const prevStatus = currentIndex > 0
    ? STATUS_ORDER[currentIndex - 1]
    : null;

  const statusLabels = {
    todo:        'Todo',
    in_progress: 'In Progress',
    done:        'Done',
  };

  return (
    <div
      className="bg-surface border border-border rounded-card
                 p-4 flex flex-col gap-2.5 cursor-pointer
                 hover:border-brand/40 hover:shadow-md
                 transition-all duration-200 group"
      onClick={onClick}
    >
      {/* Top row: title + assignee initial */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-ink leading-snug
                      line-clamp-2 flex-1">
          {task.title}
        </p>
        {task.assignee && (
          <div className="w-6 h-6 rounded-full bg-brand flex items-center
                          justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-[10px] font-semibold">
              {task.assignee.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Description preview — show if exists */}
      {task.description && task.description.trim() !== '' && (
        <p className="text-[12px] text-ink-3 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="bg-brand-light text-brand text-[11px]
                         font-semibold px-2 py-0.5 rounded-pill
                         flex items-center gap-1"
            >
              <Tag size={9} />
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[11px] text-ink-3 px-1 py-0.5">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Footer: feature name + navigation buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 min-w-0">
          {featureName ? (
            <span className="text-[11px] text-ink-3 truncate
                             max-w-[130px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full
                               bg-brand-light flex-shrink-0" />
              {featureName}
            </span>
          ) : (
            <span className="text-[11px] text-ink-3 italic">
              No linked feature
            </span>
          )}
        </div>

        {/* Two-way status navigation */}
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {prevStatus && (
            <button
              onClick={() => onStatusMove(task._id, prevStatus)}
              className="w-6 h-6 rounded-input flex items-center
                         justify-center text-ink-3 hover:bg-bg
                         hover:text-ink-2 transition-colors"
              title={`Move back to ${statusLabels[prevStatus]}`}
            >
              <ChevronLeft size={13} strokeWidth={2} />
            </button>
          )}
          {nextStatus && (
            <button
              onClick={() => onStatusMove(task._id, nextStatus)}
              className="w-6 h-6 rounded-input flex items-center
                         justify-center text-ink-3 hover:bg-brand-light
                         hover:text-brand transition-colors"
              title={`Move to ${statusLabels[nextStatus]}`}
            >
              <ChevronRight size={13} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
