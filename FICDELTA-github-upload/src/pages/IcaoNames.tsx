import IcaoNameTrainer from '../components/IcaoNameTrainer';
import { icaoNames } from '../data/icaoNames';

export default function IcaoNames() {
  return (
    <div className="w-full">
      <section className="mx-auto max-w-5xl rounded-3xl border border-white/80 bg-white/90 px-5 py-6 shadow-xl shadow-slate-200/70 transition-colors dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-slate-950/40 sm:px-8 sm:py-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 dark:text-sky-300">
              ICAO Names
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white sm:text-4xl">
              Aerodrome Names Training
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            Memorize the aerodrome names and ICAO codes required for FIC DELTA.
          </p>
        </div>
      </section>

      <IcaoNameTrainer items={icaoNames} />
    </div>
  );
}
