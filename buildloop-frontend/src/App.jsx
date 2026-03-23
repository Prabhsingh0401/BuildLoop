import './App.css'

function App() {
  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center overflow-hidden font-mono">
      {/* Futuristic Grid Background using raw CSS patterns */}
      <div 
        className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_40%,transparent_100%)] opacity-30"
      />
      
      {/* Typography */}
      <div className="z-10 text-center">
        <h1 className="text-7xl md:text-9xl font-bold tracking-tighter text-white uppercase opacity-90">
          BuildLoop
        </h1>
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="h-0.5 w-12 bg-white/20"></div>
          <span className="text-white/50 tracking-widest text-sm uppercase">System Online</span>
          <div className="h-0.5 w-12 bg-white/20"></div>
        </div>
      </div>
    </div>
  )
}

export default App
