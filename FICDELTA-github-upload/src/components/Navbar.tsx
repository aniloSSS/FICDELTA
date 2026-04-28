import { NavLink } from 'react-router-dom';

const links = [
  { label: 'Geography', to: '/geography' },
  { label: 'IFR Waypoints', to: '/ifr-waypoints' },
  { label: 'Phraseology', to: '/phraseology' },
  { label: 'Frequencies', to: '/frequencies' },
  { label: 'ICAO Names', to: '/icao-names' },
  { label: 'Reference Maps', to: '/reference-maps' },
];

export default function Navbar() {
  return (
    <header className="border-b border-white/70 bg-white/85 shadow-sm backdrop-blur transition-colors dark:border-slate-700/80 dark:bg-slate-950/85">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">
            Training Platform
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl dark:text-white">
            FIC DELTA Revision
          </h1>
        </div>

        <nav aria-label="Main navigation">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6 xl:flex xl:items-center xl:gap-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  [
                    'rounded-full px-4 py-2 text-center text-sm font-semibold transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2',
                    isActive
                      ? 'bg-sky-700 text-white shadow-sm shadow-sky-900/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-white hover:text-slate-950 hover:shadow-sm dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white',
                  ].join(' ')
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
