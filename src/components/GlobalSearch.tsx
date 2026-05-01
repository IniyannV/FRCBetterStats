import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { useGlobalSearch } from '../hooks/useTbaQueries';
import { dateRange, locationLabel } from '../utils/format';

export default function GlobalSearch() {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounced = useDebounce(value, 300);
  const search = useGlobalSearch(debounced);
  const navigate = useNavigate();

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const hasQuery = value.trim().length >= 2;
  const teams = search.teams.slice(0, 6);
  const events = search.events.slice(0, 6);

  function go(path: string) {
    navigate(path);
    setValue('');
    setOpen(false);
  }

  return (
    <div className="relative w-full max-w-xl" ref={wrapperRef}>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="input h-10 w-full pl-9"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search teams or events"
        />
      </label>

      {open && hasQuery ? (
        <div className="panel absolute left-0 right-0 top-12 z-50 max-h-[70vh] overflow-y-auto rounded-lg p-2">
          {search.isLoading ? (
            <div className="p-4 text-sm text-slate-500">Searching TBA...</div>
          ) : search.isError ? (
            <div className="p-4 text-sm text-slate-500">Search is unavailable right now.</div>
          ) : (
            <>
              <SearchGroup title="Teams">
                {teams.map((team) => (
                  <button
                    key={team.key}
                    className="block w-full rounded-md px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => go(`/teams/${team.team_number}`)}
                  >
                    <span className="block text-sm font-semibold">Team {team.team_number}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {team.nickname || team.name} · {locationLabel(team)}
                    </span>
                  </button>
                ))}
                {!teams.length ? <EmptyResult /> : null}
              </SearchGroup>

              <SearchGroup title="Events">
                {events.map((event) => (
                  <Link
                    key={event.key}
                    to={`/events/${event.key}`}
                    className="block rounded-md px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => {
                      setValue('');
                      setOpen(false);
                    }}
                  >
                    <span className="block text-sm font-semibold">{event.name}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {locationLabel(event)} · {dateRange(event.start_date, event.end_date)}
                    </span>
                  </Link>
                ))}
                {!events.length ? <EmptyResult /> : null}
              </SearchGroup>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SearchGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-1">
      <h3 className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      {children}
    </section>
  );
}

function EmptyResult() {
  return <div className="px-3 py-2 text-sm text-slate-500">No matches found.</div>;
}
