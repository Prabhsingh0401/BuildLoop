export default function PageLoader() {
  return (
    <div className="lg:ml-60 ml-0 pt-14 min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-border border-t-brand animate-spin"
        />
        <span className="text-ink-3 text-sm font-semibold">
          Loading…
        </span>
      </div>
    </div>
  );
}
