import MapTraining from '../components/MapTraining';
import { ifrWaypoints } from '../data/ifrWaypoints';

export default function IfrWaypoints() {
  return (
    <div className="w-full">
      <section className="mx-auto max-w-5xl rounded-3xl border border-white/80 bg-white/90 px-5 py-6 shadow-xl shadow-slate-200/70 transition-colors dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-slate-950/40 sm:px-8 sm:py-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 dark:text-sky-300">
              IFR Waypoints
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white sm:text-4xl">
              IFR Waypoints Training
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            Learn and locate the main IFR waypoints used in the DELTA sector.
          </p>
        </div>
      </section>

      <MapTraining
        title="IFR Waypoints Training"
        description="Learn and locate the main IFR waypoints used in the DELTA sector."
        points={ifrWaypoints}
        storageKey="fic-delta-ifr-progress"
        chartMap={{
          imageUrl: '/assets/ifr-waypoints-chart.png',
          bounds: [
            [45.95, 5.25],
            [48.2, 10.55],
          ],
        }}
      />
    </div>
  );
}
