import { useEffect, useMemo, useState } from 'react';
import type { IcaoNameItem } from '../types/icaoName';

type IcaoNameTrainerProps = {
  items: IcaoNameItem[];
};

type TrainerMode = 'flashcards' | 'icaoToAirfield' | 'airfieldToIcao' | 'list';

const modes: { label: string; value: TrainerMode }[] = [
  { label: 'Flashcards', value: 'flashcards' },
  { label: 'ICAO quiz', value: 'icaoToAirfield' },
  { label: 'Airfield quiz', value: 'airfieldToIcao' },
  { label: 'List', value: 'list' },
];

const editableItemsStorageKey = 'fic-delta-icao-names-items';

function normalizeStoredItems(items: IcaoNameItem[]) {
  return items.map((item) => {
    if (item.name.toLowerCase() === 'locarno') {
      return {
        ...item,
        id: 'locarno-lszl',
        icao: 'LSZL',
      };
    }

    return item;
  });
}

function getInitialItems(items: IcaoNameItem[]) {
  if (typeof window === 'undefined') {
    return items;
  }

  try {
    const storedValue = window.localStorage.getItem(editableItemsStorageKey);

    if (!storedValue) {
      return items;
    }

    const storedItems = JSON.parse(storedValue) as IcaoNameItem[];

    if (!Array.isArray(storedItems) || storedItems.length === 0) {
      return items;
    }

    return normalizeStoredItems(storedItems);
  } catch {
    return items;
  }
}

function createItemId(name: string, icao: string) {
  const slug = `${name}-${icao}`
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `${slug}-${Date.now()}`;
}

function getOptionItems(items: IcaoNameItem[], currentIndex: number) {
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

export default function IcaoNameTrainer({ items }: IcaoNameTrainerProps) {
  const [editableItems, setEditableItems] = useState<IcaoNameItem[]>(() =>
    getInitialItems(items),
  );
  const [mode, setMode] = useState<TrainerMode>('flashcards');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftIcao, setDraftIcao] = useState('');

  const safeCurrentIndex = Math.min(currentIndex, Math.max(editableItems.length - 1, 0));
  const currentItem = editableItems[safeCurrentIndex] ?? editableItems[0];
  const optionItems = useMemo(
    () => getOptionItems(editableItems, safeCurrentIndex),
    [safeCurrentIndex, editableItems],
  );
  const visibleItems = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    if (!normalizedSearch) {
      return editableItems;
    }

    return editableItems.filter((item) =>
      `${item.name} ${item.icao}`.toLowerCase().includes(normalizedSearch),
    );
  }, [editableItems, searchQuery]);

  const correctAnswer = currentItem?.id ?? '';
  const hasAnswered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === correctAnswer;

  useEffect(() => {
    if (currentIndex >= editableItems.length) {
      setCurrentIndex(0);
      resetCard();
    }
  }, [currentIndex, editableItems.length]);

  function saveEditableItems(nextItems: IcaoNameItem[]) {
    const sortedItems = [...nextItems].sort((firstItem, secondItem) =>
      firstItem.name.localeCompare(secondItem.name),
    );

    setEditableItems(sortedItems);
    window.localStorage.setItem(editableItemsStorageKey, JSON.stringify(sortedItems));
  }

  function resetEditor() {
    setEditingItemId(null);
    setDraftName('');
    setDraftIcao('');
  }

  function resetCard(nextMode?: TrainerMode) {
    setIsRevealed(false);
    setSelectedAnswer(null);

    if (nextMode) {
      setMode(nextMode);
    }
  }

  function handleNext() {
    setCurrentIndex((index) => (index + 1) % editableItems.length);
    resetCard();
  }

  function handleEditItem(item: IcaoNameItem) {
    setEditingItemId(item.id);
    setDraftName(item.name);
    setDraftIcao(item.icao);
  }

  function handleDeleteItem(itemId: string) {
    saveEditableItems(editableItems.filter((item) => item.id !== itemId));
    resetEditor();
    resetCard();
  }

  function handleSaveItem() {
    const trimmedName = draftName.trim();
    const trimmedIcao = draftIcao.trim().toUpperCase();

    if (!trimmedName || !trimmedIcao) {
      return;
    }

    if (editingItemId) {
      saveEditableItems(
        editableItems.map((item) =>
          item.id === editingItemId
            ? { ...item, name: trimmedName, icao: trimmedIcao }
            : item,
        ),
      );
    } else {
      saveEditableItems([
        ...editableItems,
        {
          id: createItemId(trimmedName, trimmedIcao),
          name: trimmedName,
          icao: trimmedIcao,
        },
      ]);
    }

    resetEditor();
    resetCard();
  }

  function renderSummary() {
    return (
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800">
        <div>
          <p className="text-xl font-bold text-slate-950 dark:text-white">{editableItems.length}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Names</p>
        </div>
        <div>
          <p className="text-xl font-bold text-slate-700 dark:text-slate-200">
            {safeCurrentIndex + 1}/{editableItems.length}
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Current</p>
        </div>
      </div>
    );
  }

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/40">
      <div className="border-b border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700 dark:text-sky-300">
              ICAO names module
            </p>
            <h3 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white sm:text-3xl">
              Aerodrome ICAO Names
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              Learn the aerodrome names and ICAO codes with flashcards and two-way quizzes.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 rounded-3xl bg-slate-100 p-1 dark:bg-slate-800 sm:grid-cols-2 xl:grid-cols-4">
            {modes.map((trainerMode) => (
              <button
                key={trainerMode.value}
                type="button"
                onClick={() => resetCard(trainerMode.value)}
                className={[
                  'rounded-full px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2',
                  mode === trainerMode.value
                    ? 'bg-sky-700 text-white shadow-sm shadow-sky-900/20'
                    : 'text-slate-700 hover:bg-white hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white',
                ].join(' ')}
              >
                {trainerMode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode === 'list' ? (
        <div className="bg-slate-50 p-5 dark:bg-slate-900/80 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)] lg:items-start">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Search ICAO names
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by aerodrome or ICAO code"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </label>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-sm font-bold text-slate-950 dark:text-white">
                {editingItemId ? 'Edit ICAO name' : 'Add ICAO name'}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
                <input
                  type="text"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="Aerodrome name"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <input
                  type="text"
                  value={draftIcao}
                  onChange={(event) => setDraftIcao(event.target.value.toUpperCase())}
                  placeholder="ICAO"
                  maxLength={4}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold uppercase text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleSaveItem}
                  disabled={!draftName.trim() || !draftIcao.trim()}
                  className="rounded-full bg-sky-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editingItemId ? 'Save changes' : 'Add flashcard'}
                </button>
                <button
                  type="button"
                  onClick={resetEditor}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 transition hover:border-sky-300 hover:text-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-sky-400 dark:hover:text-sky-200"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {visibleItems.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <p className="text-lg font-bold text-slate-950 dark:text-white">
                  {item.name}
                </p>
                <p className="mt-2 text-2xl font-bold text-sky-700 dark:text-sky-300">
                  {item.icao}
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleEditItem(item)}
                    className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800 transition hover:border-sky-300 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:border-sky-700 dark:bg-sky-950/60 dark:text-sky-200"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={editableItems.length <= 1}
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:border-red-300 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="bg-white p-5 dark:bg-slate-900 sm:p-8 lg:p-10">
            <article className="mx-auto flex min-h-[28rem] max-w-3xl flex-col justify-between rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-lg shadow-slate-200/70 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900 dark:shadow-slate-950/40 sm:p-8">
              {mode === 'flashcards' ? (
                <>
                  <div>
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-sky-800 dark:bg-sky-950 dark:text-sky-200">
                      ICAO names
                    </span>
                    <h4 className="mt-6 text-3xl font-bold text-slate-950 dark:text-white sm:text-4xl">
                      {currentItem?.name ?? 'No ICAO name available'}
                    </h4>
                  </div>

                  {isRevealed ? (
                    <div className="mt-8 rounded-3xl border border-sky-100 bg-sky-50 p-6 text-center dark:border-sky-900 dark:bg-sky-950/50">
                      <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
                        ICAO code
                      </p>
                      <p className="mt-3 text-5xl font-black text-slate-950 dark:text-white">
                        {currentItem?.icao ?? '-'}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-semibold text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      Try to recall the ICAO code, then reveal the answer.
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-sky-800 dark:bg-sky-950 dark:text-sky-200">
                      Multiple choice
                    </span>
                    <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {mode === 'icaoToAirfield'
                        ? 'Which aerodrome uses this ICAO code?'
                        : 'Which ICAO code belongs to this aerodrome?'}
                    </p>
                    <h4 className="mt-3 text-4xl font-black text-slate-950 dark:text-white sm:text-5xl">
                      {mode === 'icaoToAirfield' ? currentItem?.icao : currentItem?.name}
                    </h4>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {optionItems.map((item) => {
                      const value = item.id;
                      const label = mode === 'icaoToAirfield' ? item.name : item.icao;
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
                              ? 'border-sky-300 bg-sky-100 text-sky-900 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-100'
                              : '',
                            hasAnswered && isSelected && !isAnswer
                              ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
                              : '',
                            !hasAnswered
                              ? 'border-slate-200 bg-white text-slate-800 hover:border-sky-300 hover:text-sky-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-sky-400 dark:hover:text-sky-200'
                              : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400',
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
                          ? 'bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200'
                          : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200',
                      ].join(' ')}
                    >
                      {isCorrect
                        ? 'Correct'
                        : `Incorrect. Answer: ${currentItem?.name} - ${currentItem?.icao}`}
                    </p>
                  )}
                </>
              )}
            </article>
          </div>

          <aside className="flex flex-col gap-6 border-t border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/80 sm:p-6 lg:border-l lg:border-t-0">
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
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
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
