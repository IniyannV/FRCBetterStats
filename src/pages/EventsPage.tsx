import { CalendarDays, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorCard from '../components/ErrorCard';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { useEvents } from '../hooks/useTbaQueries';
import { currentSeason, dateRange, locationLabel } from '../utils/format';

export default function EventsPage() {
  const [year, setYear] = useState(currentSeason);
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('all');
  const eventsQuery = useEvents(year);

  const districts = useMemo(() => {
    const values = new Map<string, string>();
    eventsQuery.data?.forEach((event) => {
      if (event.district) values.set(event.district.abbreviation, event.district.display_name);
    });
    return [...values.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [eventsQuery.data]);

  const filteredEvents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (eventsQuery.data ?? [])
      .filter((event) => (district === 'all' ? true : event.district?.abbreviation === district))
      .filter((event) => {
        const haystack = `${event.name} ${event.city} ${event.state_prov} ${event.country}`.toLowerCase();
        return !term || haystack.includes(term);
      })
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
  }, [district, eventsQuery.data, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-frc-blue">Events</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{year} FRC Events</h1>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            className="input"
            type="number"
            min="1992"
            max={currentSeason + 1}
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            aria-label="Season"
          />
          <select className="input" value={district} onChange={(event) => setDistrict(event.target.value)}>
            <option value="all">All districts</option>
            {districts.map(([abbr, name]) => (
              <option key={abbr} value={abbr}>
                {name}
              </option>
            ))}
          </select>
          <input
            className="input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search location or event"
          />
        </div>
      </div>

      {eventsQuery.isLoading ? <CardSkeleton count={9} /> : null}
      {eventsQuery.isError ? <ErrorCard onRetry={() => void eventsQuery.refetch()} /> : null}

      {!eventsQuery.isLoading && !eventsQuery.isError ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((event) => (
            <Link key={event.key} to={`/events/${event.key}`} className="panel rounded-lg p-5 transition hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold leading-tight">{event.name}</h2>
                <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium dark:bg-slate-800">
                  {event.event_type_string}
                </span>
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <MapPin className="h-4 w-4" />
                {locationLabel(event)}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <CalendarDays className="h-4 w-4" />
                {dateRange(event.start_date, event.end_date)}
              </p>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
