import { useMemo, useState } from 'react';
import type { FrequencyItem } from '../types/frequency';

type FrequencyTrainerProps = {
  items: FrequencyItem[];
};

type TrainerMode = 'flashcards' | 'frequencyToStation' | 'stationToFrequency' | 'list';

const modes: { label: string; value: TrainerMode }[] = [
  { label: 'Flashcards', value: 'flashcards' },
  { label: 'Frequency quiz', value: 'frequencyToStation' },
  { label: 'Station quiz', value: 'stationToFrequency' },
  { label: 'List', value: 'list' },
];

function formatStation(item: FrequencyItem) {
  return `${item.name} (${item.icao})`;
}

function getOptionItems(items: FrequencyItem[], currentIndex: number) {
  if (items.length <= 4) {
    return items;
  }

  const options = [items[currentIndex]];
  let offset = 1;

  while (options.length < 4) {
    options.push(items[(currentIndex + offset * 5) % items.length]);
    offset += 1;
  }

  return options.sort((firstItem, secondItem) =>
    firstItem.id.localeCompare(secondItem.id),
  );
}

export default function FrequencyTrainer({ items }: FrequencyTrainerProps) {
  const [mode, setMode] = useState<TrainerMode>('flashcards');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const currentItem = items[currentIndex];
  const optionItems = useMemo(
    () => getOptionItems(items, currentIndex),
    [currentIndex, items],
  );
  const visibleItems = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    if (!normalizedSearch) {
      return items;
    }

    return items.filter((item) =>
      `${item.name} ${item.icao} ${item.frequency}`
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [items, searchQuery]);

  const correctAnswer =
    mode === 'frequencyToStation'
      ? currentItem.id
      : currentItem.frequency;
  const hasAnswered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === correctAnswer;

  function resetCard(nextMode?: TrainerMode) {
    setIsRevealed(false);
    setSelectedAnswer(null);

    if (nextMode) {
      setMode(nextMode);
    }
  }

  function handleNext() {
    setCurrentIndex((index) => (index + 1) % items.length);
    resetCard();
  }

  function renderSummary() {
    return (
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-center">
        <div>
          <p className="text-xl font-bold text-slate-950">{items.length}</p>
          <p className="text-xs font-semibold text-slate-500">Frequencies</p>
        </div>
        <div>
          <p className="text-xl font-bold text-slate-700">
            {currentIndex + 1}/{items.length}
          </p>
          <p className="text-xs font-semibold text-slate-500">Current</p>
        </div>
      </div>
    );
  }

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
      <div className="border-b border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700">
              Frequencies module
            </p>
            <h3 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
              Swiss Airports Frequencies
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Learn the required airport and aerodrome frequencies with flashcards and two-way quizzes.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 rounded-3xl bg-slate-100 p-1 sm:grid-cols-2 xl:grid-cols-4">
            {modes.map((trainerMode) => (
              <button
                key={trainerMode.value}
                type="button"
                onClick={() => resetCard(trainerMode.value)}
                className={[
                  'rounded-full px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2',
                  mode === trainerMode.value
                    ? 'bg-sky-700 text-white shadow-sm shadow-sky-900/20'
                    : 'text-slate-700 hover:bg-white hover:text-slate-950',
                ].join(' ')}
              >
                {trainerMode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode === 'list' ? (
        <div className="bg-slate-50 p-5 sm:p-6">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Search frequencies
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by airport, ICAO, or frequency"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            />
          </label>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {visibleItems.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-lg font-bold text-slate-950">
                  {formatStation(item)}
                </p>
                <p className="mt-2 text-2xl font-bold text-sky-700">
                  {item.frequency}
                </p>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="bg-white p-5 sm:p-8 lg:p-10">
            <article className="mx-auto flex min-h-[28rem] max-w-3xl flex-col justify-between rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-lg shadow-slate-200/70 sm:p-8">
              {mode === 'flashcards' ? (
                <>
                  <div>
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-sky-800">
                      {currentItem.icao}
                    </span>
                    <h4 className="mt-6 text-3xl font-bold text-slate-950 sm:text-4xl">
                      {formatStation(currentItem)}
                    </h4>
                  </div>

                  {isRevealed ? (
                    <div className="mt-8 rounded-3xl border border-sky-100 bg-sky-50 p-6 text-center">
                      <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700">
                        Frequency
                      </p>
                      <p className="mt-3 text-5xl font-black text-slate-950">
                        {currentItem.frequency}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-semibold text-slate-500">
                      Try to recall the frequency, then reveal the answer.
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-sky-800">
                      Multiple choice
                    </span>
                    <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                      {mode === 'frequencyToStation'
                        ? 'Which station uses this frequency?'
                        : 'Which frequency belongs to this station?'}
                    </p>
                    <h4 className="mt-3 text-4xl font-black text-slate-950 sm:text-5xl">
                      {mode === 'frequencyToStation'
                        ? currentItem.frequency
                        : formatStation(currentItem)}
                    </h4>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {optionItems.map((item) => {
                      const value =
                        mode === 'frequencyToStation' ? item.id : item.frequency;
                      const label =
                        mode === 'frequencyToStation'
                          ? formatStation(item)
                          : item.frequency;
                      const isSelected = selectedAnswer === value;
                      const isAnswer = correctAnswer === value;

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setSelectedAnswer(value)}
                          disabled={hasAnswered}
                          className={[
                            'rounded-2xl border px-4 py-4 text-left text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-default',
                            hasAnswered && isAnswer
                              ? 'border-sky-300 bg-sky-100 text-sky-900'
                              : '',
                            hasAnswered && isSelected && !isAnswer
                              ? 'border-red-300 bg-red-50 text-red-700'
                              : '',
                            !hasAnswered
                              ? 'border-slate-200 bg-white text-slate-800 hover:border-sky-300 hover:text-sky-800'
                              : 'border-slate-200 bg-white text-slate-500',
                          ].join(' ')}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {hasAnswered && (
                    <p
                      className={[
                        'mt-6 rounded-2xl p-4 text-center text-sm font-bold',
                        isCorrect
                          ? 'bg-sky-50 text-sky-800'
                          : 'bg-red-50 text-red-700',
                      ].join(' ')}
                    >
                      {isCorrect
                        ? 'Correct'
                        : `Incorrect. Answer: ${formatStation(currentItem)} - ${currentItem.frequency}`}
                    </p>
                  )}
                </>
              )}
            </article>
          </div>

          <aside className="flex flex-col gap-6 border-t border-slate-200 bg-slate-50 p-5 sm:p-6 lg:border-l lg:border-t-0">
            {renderSummary()}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {mode === 'flashcards' && (
                <button
                  type="button"
                  onClick={() => setIsRevealed(true)}
                  className="rounded-full bg-sky-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-900/20 transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                >
                  Reveal answer
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                Next
              </button>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
