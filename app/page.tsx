import BingoGame from "@/components/BingoGame";
import GridLogo from "@/components/GridLogo";

export default function Home() {
  return (
    <main className="relative mx-auto flex w-full max-w-[900px] flex-1 flex-col items-center px-4 py-8 sm:px-6 sm:py-10 lg:h-dvh lg:max-h-dvh lg:min-h-0 lg:max-w-[1600px] lg:overflow-hidden lg:px-5 lg:py-3">
      <BingoGame>
        <header className="animate-rise flex w-full max-w-[640px] flex-col items-center text-center lg:max-w-none lg:items-start lg:text-left">
          <div className="flex w-full items-center gap-3">
            <span className="chequer h-4 w-10 text-white/70 lg:hidden" />
            <span className="speed-hatch h-[3px] flex-1 rounded-full lg:hidden" />
            <GridLogo className="h-7 w-11 shrink-0" />
            <span className="speed-hatch h-[3px] flex-1 rounded-full" />
            <span className="chequer h-4 w-10 text-white/70" />
          </div>

          <h1 className="font-display mt-3 text-4xl leading-[0.86] font-bold tracking-tight uppercase sm:text-5xl xl:text-6xl">
            Grid the <span className="text-speed">Grill</span>
          </h1>

          <p className="mt-2 max-w-lg text-sm leading-snug text-muted lg:max-w-xl">
            Twenty-two traits, twenty-two drivers from the 2026 grid. Drag each driver card
            onto the trait you think belongs to them.
          </p>

        </header>
      </BingoGame>

      <p className="font-display absolute bottom-3 left-5 hidden text-[0.6rem] tracking-[0.18em] text-muted/70 uppercase lg:block">
        Progress saved in this browser · Fan-made · Not affiliated with Formula 1
      </p>

      <footer className="mt-8 w-full shrink-0 border-t border-white/10 pt-4 lg:hidden">
        <div className="flex flex-col items-center gap-2 text-center text-xs text-muted sm:flex-row sm:justify-between sm:text-left lg:text-[0.68rem]">
          <p>Progress is saved in this browser.</p>
          <p className="font-display tracking-[0.18em] uppercase">
            Fan-made · Not affiliated with Formula 1
          </p>
        </div>
      </footer>
    </main>
  );
}
