export default function DayUseBookingLoading() {
  return (
    <div
      className="min-h-screen md:flex"
      style={{ background: "#f4f8fb" }}
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading the booking form…</span>

      {/* Brand rail placeholder — same footprint as the real one so the layout
          doesn't jump when it resolves. */}
      <div
        className="h-52 sm:h-64 md:h-[calc(100vh-110px)] md:w-1/2 lg:w-[55%] md:self-start animate-pulse"
        style={{ background: "#0c1a2e" }}
      />

      <div className="md:w-1/2 lg:w-[45%] flex flex-col justify-center px-4 sm:px-8 lg:px-14 py-8 md:py-12 pb-28 md:pb-12">
        <div className="w-full max-w-md mx-auto animate-pulse">
          <div className="flex gap-1.5 mb-7">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1 flex-1 rounded-full"
                style={{ background: "#dbe3ec" }}
              />
            ))}
          </div>
          <div
            className="h-7 w-2/3 rounded-lg mb-6"
            style={{ background: "#dbe3ec" }}
          />
          <div
            className="h-11 w-full rounded-full mb-4"
            style={{ background: "#dbe3ec" }}
          />
          <div
            className="h-40 w-full rounded-2xl mb-7"
            style={{ background: "#e6edf4" }}
          />
          <div
            className="h-12 w-full rounded-full"
            style={{ background: "#dbe3ec" }}
          />
        </div>
      </div>
    </div>
  );
}
