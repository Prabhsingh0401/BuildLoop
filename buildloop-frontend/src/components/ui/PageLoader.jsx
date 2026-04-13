export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-[999] bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-10">
        {/* Large Seamless Logo */}
        <div className="relative">
          <img
            src="/buildloop_logo_black.png"
            alt="BuildLoop"
            className="h-20 md:h-24 w-auto animate-pulse"
            style={{ animationDuration: '3s' }}
          />
        </div>

        {/* Enhanced loading indicator */}
        <div className="flex flex-col items-center gap-5">
          <div className="w-48 md:w-64 h-1.5 bg-border rounded-pill overflow-hidden">
            <div
              className="h-full bg-ink/30 rounded-pill"
              style={{
                animation: 'loaderSlide 2.5s ease-in-out infinite',
                width: '40%',
              }}
            />
          </div>
          <span className="text-ink-3 text-xs font-bold tracking-[0.3em] uppercase opacity-40">
            Initialising BuildLoop
          </span>
        </div>
      </div>

      <style>{`
        @keyframes loaderSlide {
          0%   { transform: translateX(-150%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
}
