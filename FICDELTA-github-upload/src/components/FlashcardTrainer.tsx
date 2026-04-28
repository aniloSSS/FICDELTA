import { useMemo, useState } from 'react';
import type { PhraseologyCard, PhraseologyStatus } from '../types/phraseology';

type FlashcardTrainerProps = {
  cards: PhraseologyCard[];
  storageKey: string;
};

type CardFilter = 'all' | PhraseologyStatus;
type TrainerView = 'training' | 'cards';
type CardStatuses = Record<string, PhraseologyStatus>;

const statusFilters: { label: string; value: CardFilter }[] = [
  { label: 'All cards', value: 'all' },
  { label: 'Only unknown', value: 'unknown' },
  { label: 'Only difficult', value: 'difficult' },
  { label: 'Only known', value: 'known' },
];

const views: { label: string; value: TrainerView }[] = [
  { label: 'Training', value: 'training' },
  { label: 'Cards list', value: 'cards' },
];

const statuses: PhraseologyStatus[] = ['unknown', 'difficult', 'known'];

function getInitialStatuses(cards: PhraseologyCard[], storageKey: string) {
  const defaultStatuses = cards.reduce<CardStatuses>((currentStatuses, card) => {
    currentStatuses[card.id] = card.status;
    return currentStatuses;
  }, {});

  if (typeof window === 'undefined') {
    return defaultStatuses;
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey);

    if (!storedValue) {
      return defaultStatuses;
    }

    const storedStatuses = JSON.parse(storedValue) as Partial<CardStatuses>;

    return cards.reduce<CardStatuses>((currentStatuses, card) => {
      const storedStatus = storedStatuses[card.id];
      currentStatuses[card.id] = statuses.includes(storedStatus as PhraseologyStatus)
        ? (storedStatus as PhraseologyStatus)
        : card.status;
      return currentStatuses;
    }, {});
  } catch {
    return defaultStatuses;
  }
}

export default function FlashcardTrainer({
  cards,
  storageKey,
}: FlashcardTrainerProps) {
  const [activeView, setActiveView] = useState<TrainerView>('training');
  const [currentCardId, setCurrentCardId] = useState(cards[0]?.id ?? '');
  const [cardStatuses, setCardStatuses] = useState<CardStatuses>(() =>
    getInitialStatuses(cards, storageKey),
  );
  const [cardFilter, setCardFilter] = useState<CardFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [listCategoryFilter, setListCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  const categories = useMemo(() => {
    return Array.from(new Set(cards.map((card) => card.category))).sort((first, second) =>
      first.localeCompare(second),
    );
  }, [cards]);

  const summary = useMemo(() => {
    return {
      total: cards.length,
      known: cards.filter((card) => cardStatuses[card.id] === 'known').length,
      difficult: cards.filter((card) => cardStatuses[card.id] === 'difficult').length,
      unknown: cards.filter((card) => cardStatuses[card.id] === 'unknown').length,
    };
  }, [cardStatuses, cards]);

  const trainingCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesStatus =
        cardFilter === 'all' || cardStatuses[card.id] === cardFilter;
      const matchesCategory =
        categoryFilter === 'all' || card.category === categoryFilter;

      return matchesStatus && matchesCategory;
    });
  }, [cardFilter, cardStatuses, cards, categoryFilter]);

  const sortedCards = useMemo(() => {
    return [...cards].sort((firstCard, secondCard) =>
      firstCard.situation.localeCompare(secondCard.situation),
    );
  }, [cards]);

  const visibleListCards = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return sortedCards.filter((card) => {
      const matchesSearch =
        !normalizedSearch ||
        card.situation.toLowerCase().includes(normalizedSearch) ||
        card.category.toLowerCase().includes(normalizedSearch) ||
        card.expectedPhraseEnglish.toLowerCase().includes(normalizedSearch);
      const matchesCategory =
        listCategoryFilter === 'all' || card.category === listCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [listCategoryFilter, searchQuery, sortedCards]);

  const currentCard =
    trainingCards.find((card) => card.id === currentCardId) ?? trainingCards[0];

  function persistStatuses(nextStatuses: CardStatuses) {
    window.localStorage.setItem(storageKey, JSON.stringify(nextStatuses));
  }

  function setCardStatus(cardId: string, status: PhraseologyStatus) {
    setCardStatuses((currentStatuses) => {
      const nextStatuses = {
        ...currentStatuses,
        [cardId]: status,
      };

      persistStatuses(nextStatuses);
      return nextStatuses;
    });
  }

  function setAllCardsStatus(status: PhraseologyStatus) {
    const nextStatuses = cards.reduce<CardStatuses>((currentStatuses, card) => {
      currentStatuses[card.id] = status;
      return currentStatuses;
    }, {});

    setCardStatuses(nextStatuses);
    persistStatuses(nextStatuses);
  }

  function resetAnswer() {
    setIsAnswerRevealed(false);
  }

  function handleNextCard() {
    if (trainingCards.length === 0) {
      resetAnswer();
      return;
    }

    const currentIndex = Math.max(
      trainingCards.findIndex((card) => card.id === currentCard?.id),
      0,
    );
    const nextCard = trainingCards[(currentIndex + 1) % trainingCards.length];

    setCurrentCardId(nextCard.id);
    resetAnswer();
  }

  function handleStatusFilterChange(nextFilter: CardFilter) {
    setCardFilter(nextFilter);
    resetAnswer();

    const nextCards = cards.filter((card) => {
      const matchesStatus =
        nextFilter === 'all' || cardStatuses[card.id] === nextFilter;
      const matchesCategory =
        categoryFilter === 'all' || card.category === categoryFilter;

      return matchesStatus && matchesCategory;
    });

    if (!nextCards.some((card) => card.id === currentCardId) && nextCards[0]) {
      setCurrentCardId(nextCards[0].id);
    }
  }

  function handleCategoryFilterChange(nextCategory: string) {
    setCategoryFilter(nextCategory);
    resetAnswer();

    const nextCards = cards.filter((card) => {
      const matchesStatus =
        cardFilter === 'all' || cardStatuses[card.id] === cardFilter;
      const matchesCategory = nextCategory === 'all' || card.category === nextCategory;

      return matchesStatus && matchesCategory;
    });

    if (!nextCards.some((card) => card.id === currentCardId) && nextCards[0]) {
      setCurrentCardId(nextCards[0].id);
    }
  }

  return (
    <section className="mt-8 w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
      <div className="border-b border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700">
              Flashcard module
            </p>
            <h3 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
              Phraseology Practice
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Review situations, reveal the expected phrase, then mark each card based on recall.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-full bg-slate-100 p-1">
            {views.map((view) => (
              <button
                key={view.value}
                type="button"
                onClick={() => setActiveView(view.value)}
                className={[
                  'rounded-full px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2',
                  activeView === view.value
                    ? 'bg-sky-700 text-white shadow-sm shadow-sky-900/20'
                    : 'text-slate-700 hover:bg-white hover:text-slate-950',
                ].join(' ')}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeView === 'training' ? (
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="bg-white p-5 sm:p-8 lg:p-10">
            <article className="mx-auto flex min-h-[28rem] max-w-3xl flex-col justify-between rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-lg shadow-slate-200/70 sm:p-8">
              {currentCard ? (
                <>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-sky-800">
                        {currentCard.category}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
                        {cardStatuses[currentCard.id]}
                      </span>
                    </div>

                    <h4 className="mt-6 text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">
                      {currentCard.situation}
                    </h4>
                  </div>

                  {isAnswerRevealed ? (
                    <div className="mt-8 grid gap-4">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                          French phrase
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-950">
                          {currentCard.expectedPhraseFrench}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                          English phrase
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-950">
                          {currentCard.expectedPhraseEnglish}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
                          Explanation
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {currentCard.explanation}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-semibold text-slate-500">
                      Think through the phrase, then reveal the answer.
                    </div>
                  )}
                </>
              ) : (
                <div className="flex min-h-[22rem] items-center justify-center text-center text-sm font-semibold text-slate-500">
                  Change the filters to include at least one card.
                </div>
              )}
            </article>
          </div>

          <aside className="flex flex-col gap-6 border-t border-slate-200 bg-slate-50 p-5 sm:p-6 lg:border-l lg:border-t-0">
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-center">
              <div>
                <p className="text-xl font-bold text-slate-950">{summary.total}</p>
                <p className="text-xs font-semibold text-slate-500">Total cards</p>
              </div>
              <div>
                <p className="text-xl font-bold text-sky-700">{summary.known}</p>
                <p className="text-xs font-semibold text-slate-500">Known</p>
              </div>
              <div>
                <p className="text-xl font-bold text-amber-600">{summary.difficult}</p>
                <p className="text-xs font-semibold text-slate-500">Difficult</p>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-700">{summary.unknown}</p>
                <p className="text-xs font-semibold text-slate-500">Unknown</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700">Card filter</p>
              <div className="mt-3 grid gap-2">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => handleStatusFilterChange(filter.value)}
                    className={[
                      'rounded-full px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2',
                      cardFilter === filter.value
                        ? 'bg-sky-700 text-white shadow-sm shadow-sky-900/20'
                        : 'border border-slate-300 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-800',
                    ].join(' ')}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Category
              </span>
              <select
                value={categoryFilter}
                onChange={(event) => handleCategoryFilterChange(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <button
                type="button"
                onClick={() => setIsAnswerRevealed(true)}
                disabled={!currentCard}
                className="rounded-full bg-sky-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-900/20 transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reveal answer
              </button>
              <button
                type="button"
                onClick={() => currentCard && setCardStatus(currentCard.id, 'known')}
                disabled={!currentCard}
                className="rounded-full border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-bold text-sky-800 transition hover:border-sky-300 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Known
              </button>
              <button
                type="button"
                onClick={() => currentCard && setCardStatus(currentCard.id, 'difficult')}
                disabled={!currentCard}
                className="rounded-full border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-800 transition hover:border-amber-300 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Difficult
              </button>
              <button
                type="button"
                onClick={() => currentCard && setCardStatus(currentCard.id, 'unknown')}
                disabled={!currentCard}
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-sky-300 hover:text-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Unknown
              </button>
              <button
                type="button"
                onClick={handleNextCard}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                Next card
              </button>
            </div>
          </aside>
        </div>
      ) : (
        <div className="bg-slate-50 p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem_auto] lg:items-end">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Search cards
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by situation, category, or phrase"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Category
              </span>
              <select
                value={listCategoryFilter}
                onChange={(event) => setListCategoryFilter(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setAllCardsStatus('unknown')}
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-sky-300 hover:text-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                Mark all as unknown
              </button>
              <button
                type="button"
                onClick={() => setAllCardsStatus('known')}
                className="rounded-full bg-sky-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-900/20 transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                Mark all as known
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {visibleListCards.length > 0 ? (
              visibleListCards.map((card) => (
                <article
                  key={card.id}
                  className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_12rem]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-sky-800">
                        {card.category}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
                        {cardStatuses[card.id]}
                      </span>
                    </div>
                    <h4 className="mt-3 text-base font-bold leading-6 text-slate-950">
                      {card.situation}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {card.expectedPhraseEnglish}
                    </p>
                  </div>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      Status
                    </span>
                    <select
                      value={cardStatuses[card.id]}
                      onChange={(event) =>
                        setCardStatus(card.id, event.target.value as PhraseologyStatus)
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
                No card matches your search.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
