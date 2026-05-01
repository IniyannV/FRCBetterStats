import { Activity, CalendarDays, Trophy, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import ErrorCard from '../components/ErrorCard';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { useEvents } from '../hooks/useTbaQueries';
import { currentSeason, dateRange, locationLabel } from '../utils/format';

export default function HomePage() {
  const eventsQuery = useEvents(currentSeason);
  const upcomingEvents = (eventsQuery.data ?? [])
    .filter((event) => new Date(`${event.end_date}T23:59:59`) >= new Date())
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, 6);

  return (
    <div className="space-y-10">
      <section className="grid min-h-[420px] items-center gap-8 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-frc-blue">FIRST Robotics Competition</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
            FRCBetterStats
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Rankings, match results, team profiles, and event charts powered by The Blue Alliance.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/events" className="btn btn-primary">
              <CalendarDays className="h-4 w-4" />
              Current Events
            </Link>
            <Link to="/teams" className="btn">
              <Users className="h-4 w-4" />
              Team Directory
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <QuickCard icon={<Trophy className="h-5 w-5" />} title="Top-ranked teams" to="/teams" />
          <QuickCard icon={<CalendarDays className="h-5 w-5" />} title="Current season events" to="/events" />
          <QuickCard icon={<Activity className="h-5 w-5" />} title="Recent match results" to="/events" wide />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Upcoming {currentSeason} Events</h2>
          <Link to="/events" className="text-sm font-medium text-frc-blue hover:underline">
            View all
          </Link>
        </div>
        {eventsQuery.isLoading ? <CardSkeleton count={6} /> : null}
        {eventsQuery.isError ? <ErrorCard onRetry={() => void eventsQuery.refetch()} /> : null}
        {!eventsQuery.isLoading && !eventsQuery.isError ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {upcomingEvents.map((event) => (
              <Link key={event.key} to={`/events/${event.key}`} className="panel rounded-lg p-5 transition hover:-translate-y-0.5">
                <h3 className="font-semibold">{event.name}</h3>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{locationLabel(event)}</p>
                <p className="mt-1 text-sm text-slate-500">{dateRange(event.start_date, event.end_date)}</p>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function QuickCard({
  icon,
  title,
  to,
  wide,
}: {
  icon: React.ReactNode;
  title: string;
  to: string;
  wide?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`panel rounded-lg p-5 transition hover:-translate-y-0.5 ${wide ? 'sm:col-span-2' : ''}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-frc-blue dark:bg-slate-800">
        {icon}
      </div>
      <h2 className="mt-5 text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">Open the live TBA-powered view.</p>
    </Link>
  );
}
