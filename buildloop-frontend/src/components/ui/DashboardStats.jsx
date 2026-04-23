import { motion } from 'framer-motion';

/* ─── animation preset ─── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] },
});

/* ─── card shell — mirrors ProjectCard exactly ─── */
const CARD = 'bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]';
const ICON_WRAP = 'w-12 h-12 rounded-2xl bg-white/60 border border-white/40 flex items-center justify-center flex-shrink-0';

/* ─── Skeleton shimmer ─── */
function Shimmer() {
  return (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: '200%' }}
      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
      className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
    />
  );
}

/* ─── Stat card skeleton ─── */
function StatSkeleton() {
  return (
    <div className={`${CARD} p-6 relative overflow-hidden`}>
      <Shimmer />
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-100/80 rounded-full w-2/3 animate-pulse" />
        <div className="h-2 bg-gray-100/80 rounded-full w-1/2 animate-pulse" />
      </div>
      <div className="h-8 bg-gray-100/80 rounded-xl w-16 animate-pulse" />
    </div>
  );
}

/* ─── Chart skeleton ─── */
function ChartSkeleton({ className = '' }) {
  return (
    <div className={`${CARD} p-6 relative overflow-hidden ${className}`}>
      <Shimmer />
      <div className="space-y-2 mb-6">
        <div className="h-3 bg-gray-100/80 rounded-full w-1/2 animate-pulse" />
        <div className="h-2 bg-gray-100/80 rounded-full w-3/4 animate-pulse" />
      </div>
      <div className="flex items-end gap-2 h-20">
        {[55, 35, 80, 50, 90, 40, 65].map((h, i) => (
          <div key={i} className="flex-1 bg-gray-100/80 rounded-t animate-pulse" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ label, value, sub, delay, loading }) {
  if (loading) return <StatSkeleton />;
  return (
    <motion.div {...fadeUp(delay)} className={`${CARD} p-6`}>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">{label}</h3>
        <p className="text-sm text-gray-500">{sub}</p>
      </div>
      <p className="text-[32px] font-semibold text-gray-900 leading-none tracking-tight">{value}</p>
    </motion.div>
  );
}

/* ─── Highlighter-stroke area chart ─── */
function ActivityChart({ data = [], loading }) {
  if (loading) return <ChartSkeleton className="col-span-2" />;

  const raw = data.length >= 2 ? data : [0, 1, 0, 0, 0, 0, 0];
  const W = 600;
  const H = 130;
  const padT = 16;
  const padB = 8;
  const max = Math.max(...raw, 1);

  const pts = raw.map((v, i) => ({
    x: (i / (raw.length - 1)) * W,
    y: padT + (H - padT - padB) - (v / max) * (H - padT - padB),
  }));

  const buildPath = () =>
    pts
      .map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = pts[i - 1];
        const cpX = (prev.x + p.x) / 2;
        return `C ${cpX} ${prev.y} ${cpX} ${p.y} ${p.x} ${p.y}`;
      })
      .join(' ');

  const linePath = buildPath();
  const last = pts[pts.length - 1];
  const first = pts[0];
  const areaPath = `${linePath} L ${last.x} ${H} L ${first.x} ${H} Z`;

  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dayLabels = raw.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (raw.length - 1 - i));
    return days[d.getDay()];
  });

  const peak = Math.max(...raw);
  const total = raw.reduce((a, b) => a + b, 0);

  return (
    <motion.div {...fadeUp(0.1)} className={`${CARD} p-6 col-span-2`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Task Activity</h3>
          <p className="text-sm text-gray-500">Tasks created · last 7 days</p>
        </div>
        <div className="flex gap-4 text-right flex-shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Peak</p>
            <p className="text-base font-semibold text-gray-900">{peak}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Total</p>
            <p className="text-base font-semibold text-gray-900">{total}</p>
          </div>
        </div>
      </div>

      {/* SVG — highlighter stroke */}
      <div className="w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: 110 }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1F2937" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#1F2937" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Fill */}
          <motion.path
            d={areaPath}
            fill="url(#areaGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          />

          {/* Highlighter — thick, semi-transparent, rounded marker feel */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="rgba(31,41,55,0.22)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.3, delay: 0.15, ease: 'easeOut' }}
          />

          {/* Crisp line on top */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="rgba(31,41,55,0.6)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.3, delay: 0.2, ease: 'easeOut' }}
          />
        </svg>
      </div>

      {/* Day labels */}
      <div className="flex justify-between mt-2 px-0.5">
        {dayLabels.map((d, i) => (
          <span key={i} className="text-[10px] text-gray-400 tabular-nums">{d}</span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <span className="px-3 py-1 bg-gray-100/80 rounded-full text-xs font-medium text-gray-600">
          7D History
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          Live metrics
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Kanban status bar chart ─── */
function KanbanStatusChart({ todo = 0, inProgress = 0, review = 0, done = 0, loading }) {
  if (loading) return <ChartSkeleton />;

  const total = todo + inProgress + review + done || 1;
  const bars = [
    { label: 'Todo',         value: todo,       opacity: 'opacity-25' },
    { label: 'In Progress',  value: inProgress, opacity: 'opacity-55' },
    { label: 'Under Review', value: review,     opacity: 'opacity-75' },
    { label: 'Done',         value: done,       opacity: 'opacity-100' },
  ];

  return (
    <motion.div {...fadeUp(0.15)} className={`${CARD} p-6`}>
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-base font-semibold text-gray-900">Task Progress</h3>
        <p className="text-sm text-gray-500">Kanban column breakdown</p>
      </div>

      {/* Bars */}
      <div className="space-y-4">
        {bars.map(({ label, value, opacity }) => {
          const pct = Math.round((value / total) * 100);
          return (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-600 font-medium">{label}</span>
                <span className="text-gray-400 tabular-nums">{value}</span>
              </div>
              <div className="h-2 w-full bg-gray-100/80 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gray-900 ${opacity}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer badge */}
      <div className="mt-5 pt-4 border-t border-gray-100/80">
        <span className="px-3 py-1 bg-gray-100/80 rounded-full text-xs font-medium text-gray-600">
          {todo + inProgress + review + done} tasks total
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Public export ─── */
export function DashboardStats({
  loading = false,
  taskTodo = 0,
  taskInProgress = 0,
  taskReview = 0,
  taskDone = 0,
  insightCount = 0,
  feedbackCount = 0,
  activityData = [],
}) {
  const taskTotal = taskTodo + taskInProgress + taskReview + taskDone;
  return (
    <div className="mb-10 space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Tasks"     value={loading ? '—' : taskTotal}      sub="Across all columns"   delay={0}    loading={loading} />
        <StatCard label="Insights"        value={loading ? '—' : insightCount}   sub="AI-synthesised"       delay={0.1}  loading={loading} />
        <StatCard label="Feedback Items"  value={loading ? '—' : feedbackCount}  sub="Ingested total"       delay={0.15} loading={loading} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActivityChart data={activityData} loading={loading} />
        <KanbanStatusChart
          todo={taskTodo}
          inProgress={taskInProgress}
          review={taskReview}
          done={taskDone}
          loading={loading}
        />
      </div>
    </div>
  );
}
