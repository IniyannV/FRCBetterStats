import { GitCompare, MapPin, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ErrorCard from '../components/ErrorCard';
import { CardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import SortableTable, { SortableColumn } from '../components/SortableTable';
import Tabs from '../components/Tabs';
import {
  useTeam,
  useTeamEventMatches,
  useTeamEvents,
  useTeamEventStatuses,
  useTeamMedia,
} from '../hooks/useTbaQueries';
import type { TbaEvent, TbaMatch, TbaTeamEventStatus } from '../types/tba';
import { currentSeason, dateRange, locationLabel, matchLabel, teamDisplayName } from '../utils/format';
import { extractTotalRankingPoints } from '../utils/nonWinRp';

const teamTabs = [
  { id: 'events', label: 'Events' },
  { id: 'matches', label: 'Match History' },
  { id: 'stats', label: 'Stats' },
];

export default function TeamProfilePage() {
  const { teamNumber } = useParams();
  const [activeTab, setActiveTab] = useState('events');
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareTeam, setCompareTeam] = useState('');
  const teamQuery = useTeam(teamNumber);
  const mediaQuery = useTeamMedia(teamNumber, currentSeason);
  const eventsQuery = useTeamEvents(teamNumber, currentSeason);
  const statusesQuery = useTeamEventStatuses(teamNumber, currentSeason);
  const matchesQuery = useTeamEventMatches(
    teamNumber,
    (eventsQuery.data ?? []).map((event) => event.key),
  );

  const primaryMedia = mediaQuery.data?.find((media) => media.direct_url || media.view_url);

  return (
    <div className="space-y-6">
      {teamQuery.isLoading ? <CardSkeleton count={1} /> : null}
      {teamQuery.isError ? <ErrorCard onRetry={() => void teamQuery.refetch()} /> : null}

      {teamQuery.data ? (
        <>
          <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-frc-blue">Team Profile</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">
                Team {teamQuery.data.team_number}: {teamDisplayName(teamQuery.data)}
              </h1>
              <p className="mt-4 flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <MapPin className="h-4 w-4" />
                {locationLabel(teamQuery.data)}
              </p>
              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <Info label="Rookie Year" value={teamQuery.data.rookie_year ?? 'Unknown'} />
                <Info label="School" value={teamQuery.data.school_name ?? 'Unavailable'} />
                <Info label="Country" value={teamQuery.data.country ?? 'Unavailable'} />
              </div>
              <button className="btn btn-primary mt-6" onClick={() => setCompareOpen(true)}>
                <GitCompare className="h-4 w-4" />
                Compare
              </button>
            </div>

            <div className="panel overflow-hidden rounded-lg">
              {primaryMedia?.direct_url || primaryMedia?.view_url ? (
                <img
                  src={primaryMedia.direct_url ?? primaryMedia.view_url ?? ''}
                  alt={`Team ${teamQuery.data.team_number} media`}
                  className="h-64 w-full object-cover"
                />
              ) : (
                <div className="grid h-64 place-items-center bg-slate-100 text-slate-500 dark:bg-slate-900">
                  No current-season media
                </div>
              )}
            </div>
          </section>

          <Tabs tabs={teamTabs} activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'events' ? (
            <TeamEventsTab
              events={eventsQuery.data ?? []}
              statuses={statusesQuery.data ?? {}}
              isLoading={eventsQuery.isLoading || statusesQuery.isLoading}
              isError={eventsQuery.isError || statusesQuery.isError}
              refetch={() => {
                void eventsQuery.refetch();
                void statusesQuery.refetch();
              }}
            />
          ) : null}

          {activeTab === 'matches' ? (
            <TeamMatchesTab
              matches={matchesQuery.data}
              isLoading={matchesQuery.isLoading}
              isError={matchesQuery.isError}
              refetch={matchesQuery.refetch}
              teamKey={teamQuery.data.key}
            />
          ) : null}

          {activeTab === 'stats' ? (
            <TeamStatsTab
              events={eventsQuery.data ?? []}
              statuses={statusesQuery.data ?? {}}
              matches={matchesQuery.data}
              isLoading={eventsQuery.isLoading || statusesQuery.isLoading || matchesQuery.isLoading}
              isError={eventsQuery.isError || statusesQuery.isError || matchesQuery.isError}
              refetch={() => {
                void eventsQuery.refetch();
                void statusesQuery.refetch();
                matchesQuery.refetch();
              }}
              teamKey={teamQuery.data.key}
            />
          ) : null}

          {compareOpen ? (
            <ComparePanel
              currentTeam={teamQuery.data.team_number}
              compareTeam={compareTeam}
              setCompareTeam={setCompareTeam}
              onClose={() => setCompareOpen(false)}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

function TeamEventsTab({
  events,
  statuses,
  isLoading,
  isError,
  refetch,
}: {
  events: TbaEvent[];
  statuses: Record<string, TbaTeamEventStatus>;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}) {
  if (isLoading) return <CardSkeleton count={4} />;
  if (isError) return <ErrorCard onRetry={refetch} />;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {events.map((event) => {
        const status = statuses[event.key];
        return (
          <Link key={event.key} to={`/events/${event.key}`} className="panel rounded-lg p-5 transition hover:-translate-y-0.5">
            <h2 className="font-semibold">{event.name}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {locationLabel(event)} · {dateRange(event.start_date, event.end_date)}
            </p>
            <p className="mt-4 text-sm">
              Rank:{' '}
              <span className="font-semibold">{status?.qual?.ranking?.rank ? `#${status.qual.ranking.rank}` : 'Unavailable'}</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">{status?.overall_status_str ?? 'No status posted yet'}</p>
          </Link>
        );
      })}
    </div>
  );
}

function TeamMatchesTab({
  matches,
  isLoading,
  isError,
  refetch,
  teamKey,
}: {
  matches: TbaMatch[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  teamKey: string;
}) {
  if (isLoading) return <TableSkeleton columns={6} />;
  if (isError) return <ErrorCard onRetry={refetch} />;

  const columns: SortableColumn<TbaMatch>[] = [
    { id: 'match', header: 'Match', accessor: matchLabel },
    { id: 'red', header: 'Red', accessor: (row) => row.alliances.red.team_keys.join(' ') },
    { id: 'blue', header: 'Blue', accessor: (row) => row.alliances.blue.team_keys.join(' ') },
    { id: 'redScore', header: 'Red Score', accessor: (row) => row.alliances.red.score },
    { id: 'blueScore', header: 'Blue Score', accessor: (row) => row.alliances.blue.score },
    {
      id: 'result',
      header: 'Result',
      accessor: (row) => teamResult(row, teamKey),
      render: (row) => {
        const result = teamResult(row, teamKey);
        const color = result === 'Win' ? 'text-emerald-600' : result === 'Loss' ? 'text-frc-red' : 'text-slate-500';
        return <span className={`font-semibold ${color}`}>{result}</span>;
      },
    },
  ];

  return (
    <SortableTable
      rows={matches}
      columns={columns}
      getRowKey={(row) => row.key}
      filterPlaceholder="Filter match history"
      csvFilename={`${teamKey}-matches.csv`}
    />
  );
}

function TeamStatsTab({
  events,
  statuses,
  matches,
  isLoading,
  isError,
  refetch,
  teamKey,
}: {
  events: TbaEvent[];
  statuses: Record<string, TbaTeamEventStatus>;
  matches: TbaMatch[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  teamKey: string;
}) {
  const chartRows = useMemo(
    () =>
      events.map((event) => {
        const qualStatus = statuses[event.key]?.qual;
        const ranking = qualStatus?.ranking;

        return {
          event: event.short_name ?? event.event_code,
          rank: ranking?.rank ?? null,
          rankingScore: ranking ? extractTotalRankingPoints(ranking, qualStatus?.sort_order_info ?? []) : null,
        };
      }),
    [events, statuses],
  );

  if (isLoading) return <TableSkeleton columns={4} />;
  if (isError) return <ErrorCard onRetry={refetch} />;

  const completed = matches.filter((match) => match.winning_alliance);
  const wins = completed.filter((match) => teamResult(match, teamKey) === 'Win').length;
  const winRate = completed.length ? Math.round((wins / completed.length) * 100) : 0;
  const averageScore =
    completed.reduce((sum, match) => {
      const alliance = match.alliances.red.team_keys.includes(teamKey) ? match.alliances.red : match.alliances.blue;
      return sum + alliance.score;
    }, 0) / (completed.length || 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Info label="Win Rate" value={`${winRate}%`} />
        <Info label="Average Score" value={averageScore.toFixed(1)} />
        <Info label="Matches Played" value={completed.length} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartPanel title="Ranking Across Events">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartRows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="event" />
              <YAxis reversed />
              <Tooltip />
              <Line type="monotone" dataKey="rank" stroke="#1f66ff" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Ranking Score Across Events">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartRows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="event" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="rankingScore" fill="#16a34a" name="Ranking Score" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel rounded-lg p-4">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function ComparePanel({
  currentTeam,
  compareTeam,
  setCompareTeam,
  onClose,
}: {
  currentTeam: number;
  compareTeam: string;
  setCompareTeam: (value: string) => void;
  onClose: () => void;
}) {
  const otherTeamQuery = useTeam(compareTeam || undefined);
  const currentEventsQuery = useTeamEvents(currentTeam, currentSeason);
  const otherEventsQuery = useTeamEvents(compareTeam || undefined, currentSeason);

  const sharedEvents = useMemo(() => {
    const otherKeys = new Set((otherEventsQuery.data ?? []).map((event) => event.key));
    return (currentEventsQuery.data ?? []).filter((event) => otherKeys.has(event.key));
  }, [currentEventsQuery.data, otherEventsQuery.data]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-4">
      <aside className="panel ml-auto h-full max-w-2xl overflow-y-auto rounded-lg p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Team Comparison</h2>
          <button className="btn h-10 w-10 px-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <input
          className="input mt-5 w-full"
          value={compareTeam}
          onChange={(event) => setCompareTeam(event.target.value.replace(/\D/g, ''))}
          placeholder="Enter team number to compare"
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <CompareCard title={`Team ${currentTeam}`} events={currentEventsQuery.data?.length ?? 0} />
          <CompareCard
            title={otherTeamQuery.data ? `Team ${otherTeamQuery.data.team_number}` : compareTeam ? 'Loading team' : 'Second team'}
            events={otherEventsQuery.data?.length ?? 0}
          />
        </div>
        <h3 className="mt-6 font-semibold">Shared {currentSeason} Events</h3>
        <div className="mt-3 space-y-2">
          {sharedEvents.map((event) => (
            <Link key={event.key} to={`/events/${event.key}`} className="block rounded-md border border-slate-200 p-3 text-sm hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
              {event.name}
            </Link>
          ))}
          {!sharedEvents.length ? <p className="text-sm text-slate-500">No shared events found yet.</p> : null}
        </div>
      </aside>
    </div>
  );
}

function CompareCard({ title, events }: { title: string; events: number }) {
  return (
    <div className="rounded-md border border-slate-200 p-4 dark:border-slate-800">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{events} current-season events</p>
    </div>
  );
}

function teamResult(match: TbaMatch, teamKey: string) {
  if (!match.winning_alliance) return 'Scheduled';
  const alliance = match.alliances.red.team_keys.includes(teamKey) ? 'red' : 'blue';
  return match.winning_alliance === alliance ? 'Win' : 'Loss';
}
