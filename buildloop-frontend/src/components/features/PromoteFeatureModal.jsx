import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { X, Check, Loader2, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import apiClient from '@/api/client.js';

async function fetchProjectMembers(projectId) {
  const { data } = await apiClient.get(`/api/team-members?projectId=${projectId}`);
  return data.data ?? [];
}

export default function PromoteFeatureModal({ feature, projectId, isOpen, onClose, onConfirm, isPromoting }) {
  const [assignee, setAssignee] = useState('');

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers', projectId],
    queryFn: () => fetchProjectMembers(projectId),
    enabled: isOpen && !!projectId,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(feature._id, assignee);
  };

  const handleClose = () => {
    setAssignee('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="p-0 !bg-transparent border-none shadow-none focus:outline-none max-w-none sm:max-w-none w-full h-full flex items-center justify-center m-0 md:p-6 !translate-x-0 !translate-y-0 !top-0 !left-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Promote to Kanban</DialogTitle>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-[500px] h-auto bg-white shadow-[0_30px_100px_-20px_rgba(0,0,0,0.2)] flex flex-col relative z-[110] border border-gray-100 rounded-xl overflow-hidden m-auto"
        >
          {/* Header */}
          <div className="px-6 py-5 flex items-start justify-between border-b border-gray-50 bg-gray-50/20">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Send to Kanban</h2>
              <p className="text-[13px] text-gray-400 font-medium truncate max-w-[350px]">
                {feature?.title}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isPromoting}
              className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
            <div className="px-6 py-6 space-y-6">
              {/* Assignee Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <User size={12} />
                  Assignee (Optional)
                </label>
                <select
                  name="assignee"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="w-full h-11 bg-white border border-gray-100 rounded-lg px-4 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all outline-none cursor-pointer appearance-none"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member._id} value={member.name || member.email}>
                      {member.name || member.email}
                      {member.role ? ` (${member.role})` : ''}
                    </option>
                  ))}
                  {teamMembers.length === 0 && (
                    <option disabled value="">No members assigned to this project</option>
                  )}
                </select>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-5 border-t border-gray-50 bg-gray-50/20 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPromoting}
                className="px-5 h-10 rounded-lg text-gray-500 font-bold text-sm bg-white border border-gray-100 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPromoting}
                className="px-6 h-10 rounded-lg bg-ink text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-black shadow-sm transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isPromoting ? <Loader2 className="animate-spin" size={16} /> : (
                  <>
                    <Check size={16} strokeWidth={3} />
                    <span>Confirm</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
