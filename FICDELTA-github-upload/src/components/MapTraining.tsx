import { useMemo, useState } from 'react';
import {
  Circle,
  CircleMarker,
  ImageOverlay,
  MapContainer,
  TileLayer,
  useMapEvents,
} from 'react-leaflet';
import type { LatLngExpression, LeafletMouseEvent } from 'leaflet';
import type { TrainingPoint } from '../types/training';

type MapTrainingProps = {
  title: string;
  description: string;
  points: TrainingPoint[];
  storageKey: string;
  chartMap?: {
    imageUrl: string;
    bounds: [[number, number], [number, number]];
  };
};

type ClickResult = {
  distanceKm: number;
  isCorrect: boolean;
  clickedPosition: Coordinate;
};

type Coordinate = {
  latitude: number;
  longitude: number;
};

type PointStatus = 'unknown' | 'known';
type PointFilter = 'all' | 'unknown' | 'known';
type TrainingView = 'training' | 'points';
type MapMode = 'learning' | 'blank' | 'chart';
type PointStatuses = Record<string, PointStatus>;

const switzerlandCenter: LatLngExpression = [46.65, 6.8];
const defaultZoom = 8;
const mapModeStorageKey = 'fic-delta-map-mode';

const filters: { label: string; value: PointFilter }[] = [
  { label: 'All points', value: 'all' },
  { label: 'Only unknown points', value: 'unknown' },
  { label: 'Only known points', value: 'known' },
];

const views: { label: string; value: TrainingView }[] = [
  { label: 'Training', value: 'training' },
  { label: 'Points list', value: 'points' },
];

function getInitialMapMode(): MapMode {
  if (typeof window === 'undefined') {
    return 'blank';
  }

  const storedMode = window.localStorage.getItem(mapModeStorageKey);

  if (storedMode === 'learning' || storedMode === 'chart') {
    return storedMode;
  }

  return 'blank';
}

function getDefaultStatuses(points: TrainingPoint[]) {
  return points.reduce<PointStatuses>((statuses, point) => {
    statuses[point.id] = 'unknown';
    return statuses;
  }, {});
}

function getInitialStatuses(points: TrainingPoint[], storageKey: string): PointStatuses {
  const defaultStatuses = getDefaultStatuses(points);

  if (typeof window === 'undefined') {
    return defaultStatuses;
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey);

    if (!storedValue) {
      return defaultStatuses;
    }

    const storedStatuses = JSON.parse(storedValue) as Partial<PointStatuses>;

    return points.reduce<PointStatuses>((statuses, point) => {
      statuses[point.id] =
        storedStatuses[point.id] === 'known' ? 'known' : 'unknown';
      return statuses;
    }, {});
  } catch {
    return defaultStatuses;
  }
}

function getDistanceKm(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;

  const deltaLatitude = toRadians(end.latitude - start.latitude);
  const deltaLongitude = toRadians(end.longitude - start.longitude);
  const startLatitude = toRadians(start.latitude);
  const endLatitude = toRadians(end.latitude);

  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (event: LeafletMouseEvent) => void;
}) {
  useMapEvents({
    click: onMapClick,
  });

  return null;
}

export default function MapTraining({
  title,
  description,
  points,
  storageKey,
  chartMap,
}: MapTrainingProps) {
  const [activeView, setActiveView] = useState<TrainingView>('training');
  const [currentPointId, setCurrentPointId] = useState(points[0]?.id ?? '');
  const [pointStatuses, setPointStatuses] = useState<PointStatuses>(() =>
    getInitialStatuses(points, storageKey),
  );
  const [pointFilter, setPointFilter] = useState<PointFilter>('all');
  const [mapMode, setMapMode] = useState<MapMode>(getInitialMapMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorRadius, setErrorRadius] = useState(10);
  const [result, setResult] = useState<ClickResult | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const filteredTrainingPoints = useMemo(() => {
    return points.filter((point) => {
      if (pointFilter === 'all') {
        return true;
      }

      return pointStatuses[point.id] === pointFilter;
    });
  }, [pointFilter, pointStatuses, points]);

  const sortedPoints = useMemo(() => {
    return [...points].sort((firstPoint, secondPoint) =>
      firstPoint.name.localeCompare(secondPoint.name),
    );
  }, [points]);

  const visibleListPoints = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    if (!normalizedSearch) {
      return sortedPoints;
    }

    return sortedPoints.filter((point) =>
      point.name.toLowerCase().includes(normalizedSearch),
    );
  }, [searchQuery, sortedPoints]);

  const currentPoint =
    filteredTrainingPoints.find((point) => point.id === currentPointId) ??
    filteredTrainingPoints[0];

  const activeMapMode = mapMode === 'chart' && !chartMap ? 'blank' : mapMode;
  const mapModes: { label: string; value: MapMode }[] = [
    { label: 'Learning map', value: 'learning' },
    { label: 'Blank map', value: 'blank' },
    ...(chartMap ? [{ label: 'SkyGuide chart', value: 'chart' as const }] : []),
  ];
  const chartCenter: LatLngExpression | null = chartMap
    ? [
        (chartMap.bounds[0][0] + chartMap.bounds[1][0]) / 2,
        (chartMap.bounds[0][1] + chartMap.bounds[1][1]) / 2,
      ]
    : null;
  const mapCenter: LatLngExpression =
    activeMapMode === 'chart' && chartCenter ? chartCenter : switzerlandCenter;
  const answerPosition: LatLngExpression | null = currentPoint
    ? [currentPoint.latitude, currentPoint.longitude]
    : null;
  const shouldShowAnswer = showAnswer || result !== null;
  const knownCount = points.filter((point) => pointStatuses[point.id] === 'known').length;
  const unknownCount = points.length - knownCount;

  const statusText = useMemo(() => {
    if (result) {
      return result.isCorrect ? 'Correct' : 'Incorrect';
    }

    if (showAnswer) {
      return 'Answer shown';
    }

    return 'Click on the map to place the point.';
  }, [result, showAnswer]);

  function persistStatuses(nextStatuses: PointStatuses) {
    window.localStorage.setItem(storageKey, JSON.stringify(nextStatuses));
  }

  function handleMapModeChange(nextMapMode: MapMode) {
    setMapMode(nextMapMode);
    window.localStorage.setItem(mapModeStorageKey, nextMapMode);
  }

  function resetAttempt() {
    setResult(null);
    setShowAnswer(false);
  }

  function savePointStatus(pointId: string, status: PointStatus) {
    setPointStatuses((currentStatuses) => {
      const nextStatuses = {
        ...currentStatuses,
        [pointId]: status,
      };

      persistStatuses(nextStatuses);
      return nextStatuses;
    });
    resetAttempt();
  }

  function saveAllStatuses(status: PointStatus) {
    const nextStatuses = points.reduce<PointStatuses>((statuses, point) => {
      statuses[point.id] = status;
      return statuses;
    }, {});

    setPointStatuses(nextStatuses);
    persistStatuses(nextStatuses);
    resetAttempt();
  }

  function handleGuess(clickedPoint: Coordinate) {
    if (!currentPoint) {
      return;
    }

    const distanceKm = getDistanceKm(clickedPoint, currentPoint);

    setResult({
      distanceKm,
      isCorrect: distanceKm <= errorRadius,
      clickedPosition: clickedPoint,
    });
    setShowAnswer(true);
  }

  function handleMapClick(event: LeafletMouseEvent) {
    if (result || showAnswer) {
      return;
    }

    handleGuess({
      latitude: event.latlng.lat,
      longitude: event.latlng.lng,
    });
  }

  function handleNextPoint() {
    if (filteredTrainingPoints.length === 0) {
      resetAttempt();
      return;
    }

    const currentFilteredIndex = Math.max(
      filteredTrainingPoints.findIndex((point) => point.id === currentPoint?.id),
      0,
    );
    const nextPoint =
      filteredTrainingPoints[(currentFilteredIndex + 1) % filteredTrainingPoints.length];

    setCurrentPointId(nextPoint.id);
    resetAttempt();
  }

  function handleShowAnswer() {
    setShowAnswer(true);
  }

  function handleFilterChange(nextFilter: PointFilter) {
    setPointFilter(nextFilter);
    resetAttempt();

    const nextPoints = points.filter((point) => {
      if (nextFilter === 'all') {
        return true;
      }

      return pointStatuses[point.id] === nextFilter;
    });

    if (!nextPoints.some((point) => point.id === currentPointId) && nextPoints[0]) {
      setCurrentPointId(nextPoints[0].id);
    }
  }

  return (
    <section className="mt-8 w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/40">
      <div className="border-b border-slate-200 bg-white p-5 transition-colors dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700 dark:text-sky-300">
              Training module
            </p>
            <h3 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white sm:text-3xl">
              {title}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              {description}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 rounded-full bg-slate-100 p-1 dark:bg-slate-800 sm:grid-cols-2">
            {views.map((view) => (
              <button
                key={view.value}
                type="button"
                onClick={() => setActiveView(view.value)}
                className={[
                  'rounded-full px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2',
                  activeView === view.value
                    ? 'bg-sky-700 text-white shadow-sm shadow-sky-900/20'
                    : 'text-slate-700 hover:bg-white hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white',
                ].join(' ')}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeView === 'training' ? (
        <div>
          <div className="relative mx-auto h-[23rem] min-h-[23rem] w-full overflow-hidden bg-slate-100 dark:bg-slate-950 sm:h-[30rem] lg:h-[38rem]">
            <MapContainer
              key={mapMode}
              center={mapCenter}
              zoom={defaultZoom}
              scrollWheelZoom
              className="h-full w-full"
            >
              {activeMapMode === 'learning' ? (
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              ) : activeMapMode === 'chart' && chartMap ? (
                <ImageOverlay
                  url={chartMap.imageUrl}
                  bounds={chartMap.bounds}
                />
              ) : (
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                  url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                />
              )}
              <MapClickHandler onMapClick={handleMapClick} />

              {result && (
                <CircleMarker
                  center={[
                    result.clickedPosition.latitude,
                    result.clickedPosition.longitude,
                  ]}
                  pathOptions={{
                    color: result.isCorrect ? '#0284c7' : '#dc2626',
                    fillColor: result.isCorrect ? '#38bdf8' : '#f87171',
                    fillOpacity: 0.75,
                  }}
                  radius={8}
                />
              )}

              {shouldShowAnswer && answerPosition && (
                <>
                  <Circle
                    center={answerPosition}
                    pathOptions={{
                      color: '#0369a1',
                      fillColor: '#7dd3fc',
                      fillOpacity: 0.15,
                    }}
                    radius={errorRadius * 1000}
                  />
                  <CircleMarker
                    center={answerPosition}
                    pathOptions={{
                      color: '#075985',
                      fillColor: '#0ea5e9',
                      fillOpacity: 0.9,
                    }}
                    radius={9}
                  />
                </>
              )}
            </MapContainer>

            <div className="pointer-events-none absolute left-3 top-3 z-[500] max-w-[calc(100%-1.5rem)] rounded-2xl border border-white/80 bg-white/95 p-3 shadow-xl shadow-slate-900/15 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:left-4 sm:top-4 sm:max-w-md sm:p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-700 dark:text-sky-300">
                Point to place
              </p>
              <div className="mt-1 flex flex-wrap items-end gap-2">
                <h4 className="text-2xl font-black leading-none text-slate-950 dark:text-white sm:text-4xl">
                  {currentPoint?.name ?? 'No point available'}
                </h4>
                {currentPoint && (
                  <span
                    className={[
                      'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]',
                      pointStatuses[currentPoint.id] === 'known'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                        : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200',
                    ].join(' ')}
                  >
                    {pointStatuses[currentPoint.id]}
                  </span>
                )}
              </div>
            </div>

            <label className="absolute bottom-3 right-3 z-[500] block w-[min(14rem,calc(100%-1.5rem))] rounded-2xl border border-white/80 bg-white/95 p-3 shadow-xl shadow-slate-900/15 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:bottom-4 sm:right-4 sm:p-4">
              <span className="flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                <span>Error radius</span>
                <span className="text-sky-700 dark:text-sky-300">{errorRadius} km</span>
              </span>
              <input
                type="range"
                min="5"
                max="20"
                value={errorRadius}
                onChange={(event) => setErrorRadius(Number(event.target.value))}
                className="mt-3 w-full accent-sky-700"
              />
            </label>

            {(result || showAnswer) && (
              <div className="absolute right-3 top-3 z-[500] max-w-[calc(100%-1.5rem)] rounded-2xl border border-white/80 bg-white/95 p-3 text-right shadow-xl shadow-slate-900/15 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:right-4 sm:top-4 sm:p-4">
                <p
                  className={[
                    'text-xl font-black',
                    result?.isCorrect
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : result
                        ? 'text-red-600 dark:text-red-300'
                        : 'text-sky-700 dark:text-sky-300',
                  ].join(' ')}
                >
                  {statusText}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-600 dark:text-slate-300">
                  {result
                    ? `${result.distanceKm.toFixed(1)} km error`
                    : 'Answer shown'}
                </p>
              </div>
            )}

            {(result || showAnswer) && (
              <button
                type="button"
                onClick={handleNextPoint}
                className="absolute bottom-3 left-3 z-[500] rounded-full bg-sky-700 px-5 py-3 text-sm font-black text-white shadow-xl shadow-sky-950/25 transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 sm:bottom-4 sm:left-4"
              >
                Next point
              </button>
            )}
          </div>

          <aside className="grid gap-4 border-t border-slate-200 bg-slate-50 p-5 transition-colors dark:border-slate-700 dark:bg-slate-900/80 sm:p-6 lg:grid-cols-[0.9fr_1.1fr_1.1fr_1.1fr]">
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-center transition-colors dark:border-slate-700 dark:bg-slate-800">
              <div>
                <p className="text-xl font-bold text-slate-950 dark:text-white">{points.length}</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total points</p>
              </div>
              <div>
                <p className="text-xl font-bold text-sky-700 dark:text-sky-300">{knownCount}</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Known points</p>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-700 dark:text-slate-200">{unknownCount}</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Unknown points</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors dark:border-slate-700 dark:bg-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Map mode</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                {mapModes.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => handleMapModeChange(mode.value)}
                    className={[
                      'rounded-full px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2',
                      activeMapMode === mode.value
                        ? 'bg-sky-700 text-white shadow-sm shadow-sky-900/20'
                        : 'border border-slate-300 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:text-sky-200',
                    ].join(' ')}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors dark:border-slate-700 dark:bg-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Point filter</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                {filters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => handleFilterChange(filter.value)}
                    className={[
                      'rounded-full px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2',
                      pointFilter === filter.value
                        ? 'bg-sky-700 text-white shadow-sm shadow-sky-900/20'
                        : 'border border-slate-300 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:text-sky-200',
                    ].join(' ')}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors dark:border-slate-700 dark:bg-slate-800 sm:grid-cols-2 lg:grid-cols-1">
              <button
                type="button"
                onClick={() => currentPoint && savePointStatus(currentPoint.id, 'known')}
                disabled={!currentPoint}
                className="rounded-full border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-bold text-sky-800 transition hover:border-sky-300 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-sky-700 dark:bg-sky-950/60 dark:text-sky-200 dark:hover:border-sky-500"
              >
                Mark as known
              </button>
              <button
                type="button"
                onClick={() => currentPoint && savePointStatus(currentPoint.id, 'unknown')}
                disabled={!currentPoint}
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-sky-300 hover:text-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-sky-400 dark:hover:text-sky-200"
              >
                Mark as unknown
              </button>
              <button
                type="button"
                onClick={handleShowAnswer}
                disabled={!currentPoint}
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-sky-300 hover:text-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-sky-400 dark:hover:text-sky-200"
              >
                Show answer
              </button>
              <button
                type="button"
                onClick={handleNextPoint}
                className="rounded-full bg-sky-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-900/20 transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                Next point
              </button>
            </div>
          </aside>
        </div>
      ) : (
        <div className="bg-slate-50 p-5 transition-colors dark:bg-slate-900/80 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Search points
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => saveAllStatuses('known')}
                className="rounded-full bg-sky-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-900/20 transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                Mark all as known
              </button>
              <button
                type="button"
                onClick={() => saveAllStatuses('unknown')}
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-sky-300 hover:text-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-sky-400 dark:hover:text-sky-200"
              >
                Mark all as unknown
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-1.5 sm:grid-cols-3 xl:grid-cols-4">
            {visibleListPoints.length > 0 ? (
              visibleListPoints.map((point) => {
                const isKnown = pointStatuses[point.id] === 'known';

                return (
                  <label
                    key={point.id}
                    className={[
                      'flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-2 py-1.5 transition',
                      isKnown
                        ? 'border-emerald-200 bg-emerald-50 hover:border-emerald-300 dark:border-emerald-800 dark:bg-emerald-950/40'
                        : 'border-red-200 bg-red-50 hover:border-red-300 dark:border-red-900 dark:bg-red-950/35',
                    ].join(' ')}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold text-slate-950 dark:text-slate-100">
                        {point.name}
                      </span>
                      <span
                        className={[
                          'mt-0.5 inline-flex rounded-full px-1.5 py-0 text-[9px] font-bold uppercase tracking-[0.1em]',
                          isKnown
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-700',
                        ].join(' ')}
                      >
                        {isKnown ? 'known' : 'unknown'}
                      </span>
                    </span>

                    <input
                      type="checkbox"
                      checked={isKnown}
                      onChange={(event) =>
                        savePointStatus(
                          point.id,
                          event.target.checked ? 'known' : 'unknown',
                        )
                      }
                      className="h-4 w-4 shrink-0 accent-emerald-600"
                    />
                  </label>
                );
              })
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                No point matches your search.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
