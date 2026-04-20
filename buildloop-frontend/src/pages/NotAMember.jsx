import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';

/**
 * Shown when a user signs in with Google but their email
 * hasn't been added to any team by a Project Manager.
 */
export default function NotAMember() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center px-4">
      {/* Background grid */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)] opacity-40 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_8px_40px_rgb(0,0,0,0.06)] p-10 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shadow-sm">
              <ShieldOff className="w-8 h-8 text-red-400" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-[22px] font-semibold text-gray-900 mb-3 leading-snug">
            You're not a member of any organisation
          </h1>

          {/* Body */}
          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            Your email isn't linked to any team on BuildLoop yet. Ask your{' '}
            <span className="font-semibold text-gray-700">Project Manager</span> to add you,
            then sign in again.
          </p>

          {/* Steps */}
          <div className="text-left bg-gray-50/80 border border-gray-100 rounded-xl p-4 mb-8 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              What to do next
            </p>
            {[
              'Tell your PM your email address',
              'Wait for them to add you in their Dashboard',
              'Sign in again with the same Google account',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#1a1d23] text-white text-[10px] font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-600">{step}</p>
              </div>
            ))}
          </div>

          {/* Back button */}
          <button
            id="not-a-member-go-back"
            onClick={() => navigate('/', { replace: true })}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1a1d23] hover:bg-black text-white rounded-full text-sm font-semibold transition-all shadow-md active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back to home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
