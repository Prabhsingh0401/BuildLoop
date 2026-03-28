export default function Dashboard() {
  return (
    <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden font-mono py-20">
      {/* Futuristic Grid Background using raw CSS patterns */}
      <div 
        className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_30%,transparent_100%)] opacity-30 pointer-events-none"
      />
      
      {/* Typography */}
      <div className="z-10 text-center select-none relative -mt-10">
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-white uppercase opacity-90 drop-shadow-2xl">
          BuildLoop
        </h1>
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="h-0.5 w-8 md:w-12 bg-white/20"></div>
          <span className="text-white/50 tracking-[0.3em] text-xs md:text-sm uppercase font-semibold">System Online</span>
          <div className="h-0.5 w-8 md:w-12 bg-white/20"></div>
        </div>
      </div>
    </div>
  );
}
