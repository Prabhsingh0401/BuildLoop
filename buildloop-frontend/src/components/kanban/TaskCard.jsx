import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { MessageSquare, Clock } from 'lucide-react';

export default function TaskCard({ task, feature, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="group cursor-grab active:cursor-grabbing focus:outline-none"
    >
      <motion.div
        whileHover={{ y: -2, shadow: "0 4px 12px rgba(0,0,0,0.05)" }}
        className="
          bg-white border border-gray-100 rounded-lg p-4
          shadow-sm transition-all duration-200
          hover:border-gray-200 hover:shadow-md
        "
      >
        <div className="flex flex-col gap-3">
          {/* Header Tags */}
          <div className="flex flex-wrap gap-1.5">
            {feature && (
              <span className="px-2 py-0.5 rounded bg-gray-50 text-gray-500 text-[10px] font-medium uppercase tracking-wider border border-gray-100">
                {feature}
              </span>
            )}
            {(task.tags || []).slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-gray-900 text-white text-[10px] font-medium uppercase tracking-wider"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-1">
            <h3 className="text-[14px] font-medium text-gray-900 leading-snug group-hover:text-black">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-[12px] text-gray-500 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>

          {/* Footer Metadata */}
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-gray-400">
                <Clock size={12} strokeWidth={2} />
                <span className="text-[11px] font-medium">2d</span>
              </div>
            </div>

            {task.assignee ? (
              <div className="w-5 h-5 rounded bg-gray-900 flex items-center justify-center">
                <span className="text-[9px] font-medium text-white">{task.assignee[0]}</span>
              </div>
            ) : (
              <div className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center">
                <span className="text-[9px] text-gray-300">-</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
