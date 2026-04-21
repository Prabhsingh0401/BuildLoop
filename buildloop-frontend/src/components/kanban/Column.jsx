import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard.jsx';
import { motion } from 'framer-motion';

export default function Column({ id, title, tasks, dotClass, featureMap, subtaskStatsMap = {}, onCardClick }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col flex-1 min-w-0 h-full min-h-[600px] rounded-xl bg-gray-50/80 border border-gray-200 transition-all duration-300
        ${isOver ? 'bg-gray-100 ring-2 ring-gray-300 shadow-md' : ''}
      `}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white/50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotClass}`} />
          <h2 className="text-[14px] font-medium text-gray-900">
            {title}
          </h2>
          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 min-w-[20px] text-center">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Task List container */}
      <div className="flex-1 px-3 py-3 overflow-y-auto no-scrollbar min-h-[200px]">
        <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2.5">
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                feature={featureMap?.[task.featureId]}
                subtaskStats={subtaskStatsMap[task._id]}
                onClick={() => onCardClick(task)}
              />
            ))}
          </div>
        </SortableContext>

        {/* Drop indicator if empty */}
        {tasks.length === 0 && (
          <div className="h-24 border border-dashed border-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-[11px] font-medium text-gray-400">
              Drop tasks here
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
