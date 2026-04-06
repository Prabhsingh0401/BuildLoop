import { motion } from 'framer-motion';

const SkeletonCard = () => (
  <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
    {/* Shimmer Effect */}
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: '200%' }}
      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 pointer-events-none"
    />
    
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 rounded-2xl bg-gray-100/80 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-100/80 rounded-full w-3/4 animate-pulse fill-mode-forwards" />
        <div className="h-2 bg-gray-100/80 rounded-full w-1/2 animate-pulse" />
      </div>
    </div>
    
    <div className="space-y-3">
      <div className="h-2 bg-gray-100/80 rounded-full w-full animate-pulse" />
      <div className="h-2 bg-gray-100/80 rounded-full w-[90%] animate-pulse" />
      <div className="h-2 bg-gray-100/80 rounded-full w-4/5 animate-pulse" />
    </div>
    
    <div className="mt-8 flex justify-between gap-3">
      <div className="h-8 bg-gray-100/80 rounded-xl w-24 animate-pulse" />
      <div className="h-8 bg-gray-100/80 rounded-xl w-24 animate-pulse" />
    </div>
  </div>
);

export default function Dashboard() {
  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col py-10 px-4">
      {/* Subtle Grid Background */}
      <div 
        className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)] opacity-40 pointer-events-none"
      />
      
      {/* Dashboard Section */}
      <div className="z-10 w-full max-w-7xl mx-auto">

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <SkeletonCard />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
