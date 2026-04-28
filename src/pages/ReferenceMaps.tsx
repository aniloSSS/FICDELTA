import { useMemo, useState } from 'react';
import {
  CircleMarker,
  ImageOverlay,
  MapContainer,
  TileLayer,
  Tooltip,
} from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { geographyPoints } from '../data/geographyPoints';
import { ifrWaypoints } from '../data/ifrWaypoints';
import type { TrainingPoint } from '../types/training';

type DatasetMode = 'geography' | 'ifr';
type IfrMapMode = 'geographic' | 'chart';

const switzerlandCenter: LatLngExpression = [46.65, 6.8];
const ifrChart = {
  imageUrl: '/assets/ifr-waypoints-chart.png',
  bounds: [
    [45.95, 5.25],
    [48.2, 10.55],
  ] as [[number, number], [number, number]],
};

function getMapCenter(datasetMode: DatasetMode, ifrMapMode: IfrMapMode) {
  if (datasetMode === 'ifr' && ifrMapMode === 'chart') {
    return [
      (ifrChart.bounds[0][0] + ifrChart.bounds[1][0]) / 2,
      (ifrChart.bounds[0][1] + ifrChart.bounds[1][1]) / 2,
    ] as LatLngExpression;
  }

  return switzerlandCenter;
}

function sortPoints(points: TrainingPoint[]) {
  return [...points].sort((firstPoint, secondPoint) =>
    firstPoint.name.localeCompare(secondPoint.name),
  );
}

export default function ReferenceMaps() {
  const [datasetMode, setDatasetMode] = useState<DatasetMode>('geography');
  const [ifrMapMode, setIfrMapMode] = useState<IfrMapMode>('geographic');

  const points = useMemo(() => {
    return sortPoints(datasetMode === 'geography' ? geographyPoints : ifrWaypoints);
  }, [datasetMode]);
  const isIfrChart = datasetMode === 'ifr' && ifrMapMode === 'chart';

  return (
    <div className="w-full">
      <section className="mx-auto max-w-5xl rounded-3xl border border-white/80 bg-white/90 px-5 py-6 shadow-xl shadow-slate-200/70 transition-colors dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-slate-950/40 sm:px-8 sm:py-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 dark:text-sky-300">
              Reference Maps
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white sm:text-4xl">
              Points Overview
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            Study all Geography points or IFR waypoints on a dedicated map before training.
          </p>
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
        <div className="border-b border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700">
                Study map
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
                {datasetMode === 'geography' ? 'Geography Points' : 'IFR Waypoints'}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {points.length} points visible with labels.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid grid-cols-2 gap-2 rounded-full bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setDatasetMode('geography')}
                  className={[
                    'rounded-full px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2',
                    datasetMode === 'geography'
                      ? 'bg-sky-700 text-white shadow-sm shadow-sky-900/20'
                      : 'text-slate-700 hover:bg-white hover:text-slate-950',
                  ].join(' ')}
                >
                  Geography
                </button>
                <button
                  type="button"
                  onClick={() => setDatasetMode('ifr')}
                  className={[
                    'rounded-full px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2',
                    datasetMode === 'ifr'
                      ? 'bg-sky-700 text-white shadow-sm shadow-sky-900/20'
                      : 'text-slate-700 hover:bg-white hover:text-slate-950',
                  ].join(' ')}
                >
                  IFR
                </button>
              </div>

              {datasetMode === 'ifr' && (
                <div className="grid grid-cols-2 gap-2 rounded-full bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setIfrMapMode('geographic')}
                    className={[
                      'rounded-full px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2',
                      ifrMapMode === 'geographic'
                        ? 'bg-sky-700 text-white shadow-sm shadow-sky-900/20'
                        : 'text-slate-700 hover:bg-white hover:text-slate-950',
                    ].join(' ')}
                  >
                    Geo map
                  </button>
                  <button
                    type="button"
                    onClick={() => setIfrMapMode('chart')}
                    className={[
                      'rounded-full px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2',
                      ifrMapMode === 'chart'
                        ? 'bg-sky-700 text-white shadow-sm shadow-sky-900/20'
                        : 'text-slate-700 hover:bg-white hover:text-slate-950',
                    ].join(' ')}
                  >
                    IFR chart
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-[30rem] bg-slate-100 sm:h-[38rem] lg:h-[46rem]">
          <MapContainer
            key={`${datasetMode}-${ifrMapMode}`}
            center={getMapCenter(datasetMode, ifrMapMode)}
            zoom={8}
            scrollWheelZoom
            className="h-full w-full"
          >
            {isIfrChart ? (
              <ImageOverlay url={ifrChart.imageUrl} bounds={ifrChart.bounds} />
            ) : (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            )}

            {points.map((point) => (
              <CircleMarker
                key={point.id}
                center={[point.latitude, point.longitude]}
                pathOptions={{
                  color: datasetMode === 'ifr' ? '#1d4ed8' : '#0f766e',
                  fillColor: datasetMode === 'ifr' ? '#60a5fa' : '#5eead4',
                  fillOpacity: 0.95,
                  weight: 2,
                }}
                radius={5}
              >
                <Tooltip
                  permanent
                  direction="top"
                  offset={[0, -6]}
                  className="reference-map-label"
                >
                  {point.name}
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </section>
    </div>
  );
}
