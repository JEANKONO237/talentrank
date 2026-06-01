export function TrustedBy() {
  const studios = [
    "ILM",
    "DNEG",
    "FRAMESTORE",
    "RODEO FX",
    "MPC",
    "BUCK",
    "ARTSTATION",
    "AARDMAN",
    "MIHOYO",
  ];
  return (
    <section className="py-12">
      <div className="container-page">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-mist-500">
          Trusted by studios sourcing premium creative talent
        </p>
        <div className="mt-7 grid grid-cols-3 items-center gap-x-8 gap-y-6 sm:grid-cols-5 lg:grid-cols-9">
          {studios.map((s) => (
            <div
              key={s}
              className="text-center font-display text-[13px] font-semibold tracking-[0.18em] text-mist-400/80 transition-colors hover:text-mist-50"
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
