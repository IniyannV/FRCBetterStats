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
import { TableSkeleton } from '../components/LoadingSkeleton';
import SortableTable, { SortableColumn, SortState } from '../components/SortableTable';
import Tabs from '../components/Tabs';
import { useNonWinRankings } from '../hooks/useNonWinRankings';
import {
  useEventAlliances,
  useEventMatches,
  useEventOprs,
  useEventRankings,
  useEventTeams,
} from '../hooks/useTbaQueries';
import type { TbaAlliance, TbaMatch, TbaOprs, TbaRankingRow, TbaRankingSortInfo, TbaTeam } from '../types/tba';
import type { NonWinRpMetrics } from '../utils/nonWinRp';
import { formatNumber, matchLabel, recordLabel, teamDisplayName, teamNumberFromKey } from '../utils/format';

const tabs = [
  { id: 'rankings', label: 'Rankings' },
  { id: 'matches', label: 'Schedule & Results' },
  { id: 'bracket', label: 'Bracket' },
  { id: 'stats', label: 'Stats' },
];

interface RankingTableRow {
  key: string;
  rank: number;
  officialRank: number;
  teamNumber: string;
  teamName: string;
  record: string;
  wins: number;
  rankingScore: number | null;
  officialRp: number | null;
  winRp: number;
  nonWinRp: number | null;
  epa: number | null;
  opr: number | null;
  dpr: number | null;
  ccwm: number | null;
  autoPoints: number | null;
  teleopPoints: number | null;
}

type RankingMode = 'official' | 'nonWinRP';

export default function EventDetailPage() {
  const { eventKey } = useParams();
  const [activeTab, setActiveTab] = useState('rankings');
  const teamsQuery = useEventTeams(eventKey);
  const rankingsQuery = useEventRankings(eventKey);
  const oprsQuery = useEventOprs(eventKey);
  const matchesQuery = useEventMatches(eventKey);
  const alliancesQuery = useEventAlliances(eventKey);

  const eventName = eventKey?.toUpperCase() ?? 'Event';

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-frc-blue">Event Detail</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{eventName}</h1>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'rankings' ? (
        <RankingsTab
          eventKey={eventKey}
          teams={teamsQuery.data ?? []}
          isLoading={teamsQuery.isLoading || rankingsQuery.isLoading || oprsQuery.isLoading}
          isError={teamsQuery.isError || rankingsQuery.isError || oprsQuery.isError}
          refetch={() => {
            void teamsQuery.refetch();
            void rankingsQuery.refetch();
            void oprsQuery.refetch();
            void matchesQuery.refetch();
          }}
          rankings={rankingsQuery.data?.rankings ?? []}
          sortInfo={rankingsQuery.data?.sort_order_info ?? []}
          extraInfo={rankingsQuery.data?.extra_stats_info ?? []}
          oprs={oprsQuery.data}
          matches={matchesQuery.data ?? []}
          matchesLoading={matchesQuery.isLoading}
          matchesError={matchesQuery.isError}
        />
      ) : null}

      {activeTab === 'matches' ? (
        <MatchesTab
          eventKey={eventKey}
          matches={matchesQuery.data ?? []}
          isLoading={matchesQuery.isLoading}
          isError={matchesQuery.isError}
          refetch={() => void matchesQuery.refetch()}
        />
      ) : null}

      {activeTab === 'bracket' ? (
        <BracketTab
          alliances={alliancesQuery.data ?? []}
          matches={matchesQuery.data ?? []}
          isLoading={alliancesQuery.isLoading || matchesQuery.isLoading}
          isError={alliancesQuery.isError || matchesQuery.isError}
          refetch={() => {
            void alliancesQuery.refetch();
            void matchesQuery.refetch();
          }}
        />
      ) : null}

      {activeTab === 'stats' ? (
        <StatsTab
          rankings={rankingsQuery.data?.rankings ?? []}
          teams={teamsQuery.data ?? []}
          matches={matchesQuery.data ?? []}
          sortInfo={rankingsQuery.data?.sort_order_info ?? []}
          extraInfo={rankingsQuery.data?.extra_stats_info ?? []}
          oprs={oprsQuery.data}
          isLoading={rankingsQuery.isLoading || teamsQuery.isLoading || matchesQuery.isLoading || oprsQuery.isLoading}
          isError={rankingsQuery.isError || teamsQuery.isError || matchesQuery.isError || oprsQuery.isError}
          refetch={() => {
            void rankingsQuery.refetch();
            void teamsQuery.refetch();
            void matchesQuery.refetch();
            void oprsQuery.refetch();
          }}
        />
      ) : null}
    </div>
  );
}

function RankingsTab({
  eventKey,
  teams,
  rankings,
  sortInfo,
  extraInfo,
  oprs,
  matches,
  matchesLoading,
  matchesError,
  isLoading,
  isError,
  refetch,
}: {
  eventKey?: string;
  teams: TbaTeam[];
  rankings: TbaRankingRow[];
  sortInfo: Pick<TbaRankingSortInfo, 'name'>[];
  extraInfo: Pick<TbaRankingSortInfo, 'name'>[];
  oprs?: TbaOprs;
  matches: TbaMatch[];
  matchesLoading: boolean;
  matchesError: boolean;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}) {
  const [rankingMode, setRankingMode] = useState<RankingMode>('official');
  const [sortByMode, setSortByMode] = useState<Record<RankingMode, SortState>>({
    official: { id: 'rank', direction: 'asc' },
    nonWinRP: { id: 'rank', direction: 'asc' },
  });
  const nonWinMetrics = useNonWinRankings({ rankings, matches, sortInfo, oprs });
  const nonWinReady = !matchesLoading && !matchesError;
  const rows = useMemo(
    () => buildRankingRows(rankings, teams, sortInfo, extraInfo, oprs, nonWinMetrics, rankingMode, nonWinReady),
    [extraInfo, nonWinMetrics, nonWinReady, oprs, rankingMode, rankings, sortInfo, teams],
  );

  if (isLoading) return <TableSkeleton columns={10} />;
  if (isError || (rankingMode === 'nonWinRP' && matchesError)) return <ErrorCard onRetry={refetch} />;
  if (rankingMode === 'nonWinRP' && matchesLoading) return <TableSkeleton columns={12} />;

  const columns: SortableColumn<RankingTableRow>[] = [
    { id: 'rank', header: 'Rank', accessor: (row) => row.rank },
    {
      id: 'teamNumber',
      header: 'Team Number',
      accessor: (row) => row.teamNumber,
      render: (row) => (
        <Link className="font-semibold text-frc-blue hover:underline" to={`/teams/${row.teamNumber}`}>
          {row.teamNumber}
        </Link>
      ),
    },
    { id: 'teamName', header: 'Team Name', accessor: (row) => row.teamName },
    { id: 'record', header: 'W-L-T', accessor: (row) => row.record },
    { id: 'wins', header: 'Wins', accessor: (row) => row.wins },
    { id: 'officialRp', header: 'Official RP', accessor: (row) => row.officialRp, render: (row) => formatNumber(row.officialRp) },
    { id: 'nonWinRp', header: 'Non-Win RP', accessor: (row) => row.nonWinRp, render: (row) => formatNumber(row.nonWinRp) },
    { id: 'epa', header: 'EPA', accessor: (row) => row.epa, render: (row) => formatNumber(row.epa) },
    { id: 'dpr', header: 'DPR', accessor: (row) => row.dpr, render: (row) => formatNumber(row.dpr) },
    { id: 'ccwm', header: 'CCWM', accessor: (row) => row.ccwm, render: (row) => formatNumber(row.ccwm) },
    { id: 'autoPoints', header: 'Auto Points', accessor: (row) => row.autoPoints, render: (row) => formatNumber(row.autoPoints) },
    {
      id: 'teleopPoints',
      header: 'Teleop Points',
      accessor: (row) => row.teleopPoints,
      render: (row) => formatNumber(row.teleopPoints),
    },
  ];

  return (
    <div className="space-y-4">
      <RankingModeToggle rankingMode={rankingMode} onChange={setRankingMode} />
      <SortableTable
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.key}
        filterPlaceholder="Filter by team, rank, record, or stat"
        csvFilename={`${eventKey ?? 'event'}-${rankingMode === 'official' ? 'official' : 'non-win-rp'}-rankings.csv`}
        sortState={sortByMode[rankingMode]}
        onSortChange={(sort) => setSortByMode((current) => ({ ...current, [rankingMode]: sort }))}
      />
    </div>
  );
}

function RankingModeToggle({
  rankingMode,
  onChange,
}: {
  rankingMode: RankingMode;
  onChange: (rankingMode: RankingMode) => void;
}) {
  const options: { id: RankingMode; label: string }[] = [
    { id: 'official', label: 'Official Rankings' },
    { id: 'nonWinRP', label: 'Non-Win RP Rankings' },
  ];

  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      {options.map((option) => {
        const active = rankingMode === option.id;

        return (
          <button
            key={option.id}
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              active
                ? 'bg-frc-blue text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function MatchesTab({
  eventKey,
  matches,
  isLoading,
  isError,
  refetch,
}: {
  eventKey?: string;
  matches: TbaMatch[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}) {
  if (isLoading) return <TableSkeleton columns={6} />;
  if (isError) return <ErrorCard onRetry={refetch} />;

  const rows = [...matches].sort((a, b) => {
    const order = { qm: 0, ef: 1, qf: 2, sf: 3, f: 4 };
    return (
      order[a.comp_level] - order[b.comp_level] ||
      a.set_number - b.set_number ||
      a.match_number - b.match_number
    );
  });

  const columns: SortableColumn<TbaMatch>[] = [
    { id: 'label', header: 'Match', accessor: matchLabel },
    {
      id: 'red',
      header: 'Red Alliance',
      accessor: (row) => row.alliances.red.team_keys.map(teamNumberFromKey).join(' '),
      render: (row) => <AllianceList alliance="red" match={row} />,
    },
    {
      id: 'blue',
      header: 'Blue Alliance',
      accessor: (row) => row.alliances.blue.team_keys.map(teamNumberFromKey).join(' '),
      render: (row) => <AllianceList alliance="blue" match={row} />,
    },
    { id: 'redScore', header: 'Red Score', accessor: (row) => row.alliances.red.score },
    { id: 'blueScore', header: 'Blue Score', accessor: (row) => row.alliances.blue.score },
    {
      id: 'winner',
      header: 'Result',
      accessor: (row) => row.winning_alliance || 'Scheduled',
      render: (row) =>
        row.winning_alliance ? (
          <span className={row.winning_alliance === 'red' ? 'font-semibold text-frc-red' : 'font-semibold text-frc-blue'}>
            {row.winning_alliance.toUpperCase()} win
          </span>
        ) : (
          <span className="text-slate-500">Scheduled</span>
        ),
    },
  ];

  return (
    <SortableTable
      rows={rows}
      columns={columns}
      getRowKey={(row) => row.key}
      filterPlaceholder="Filter matches or teams"
      csvFilename={`${eventKey ?? 'event'}-matches.csv`}
    />
  );
}

function AllianceList({ match, alliance }: { match: TbaMatch; alliance: 'red' | 'blue' }) {
  const won = match.winning_alliance === alliance;
  return (
    <div className={`flex gap-2 ${won ? 'font-bold' : ''}`}>
      {match.alliances[alliance].team_keys.map((teamKey) => (
        <Link
          key={teamKey}
          to={`/teams/${teamNumberFromKey(teamKey)}`}
          className={alliance === 'red' ? 'text-frc-red hover:underline' : 'text-frc-blue hover:underline'}
        >
          {teamNumberFromKey(teamKey)}
        </Link>
      ))}
    </div>
  );
}

function BracketTab({
  alliances,
  matches,
  isLoading,
  isError,
  refetch,
}: {
  alliances: TbaAlliance[];
  matches: TbaMatch[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}) {
  if (isLoading) return <TableSkeleton columns={4} />;
  if (isError) return <ErrorCard onRetry={refetch} />;

  const playoffMatches = matches.filter((match) => match.comp_level !== 'qm');

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {alliances.map((alliance, index) => (
          <div key={`${alliance.name}-${index}`} className="panel rounded-lg p-4">
            <h3 className="font-semibold">{alliance.name || `Alliance ${index + 1}`}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {alliance.picks.map((teamKey) => (
                <Link
                  key={teamKey}
                  to={`/teams/${teamNumberFromKey(teamKey)}`}
                  className="rounded bg-slate-100 px-2 py-1 text-sm font-medium dark:bg-slate-800"
                >
                  {teamNumberFromKey(teamKey)}
                </Link>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-500">{alliance.status?.status ?? 'Selection listed by TBA'}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {['qf', 'sf', 'f'].map((level) => (
          <div key={level} className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {level === 'qf' ? 'Quarterfinals' : level === 'sf' ? 'Semifinals' : 'Finals'}
            </h3>
            {playoffMatches
              .filter((match) => match.comp_level === level)
              .sort((a, b) => a.set_number - b.set_number || a.match_number - b.match_number)
              .map((match) => (
                <div key={match.key} className="panel rounded-lg p-4">
                  <div className="mb-3 text-sm font-semibold">{matchLabel(match)}</div>
                  <BracketAlliance match={match} alliance="red" />
                  <BracketAlliance match={match} alliance="blue" />
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketAlliance({ match, alliance }: { match: TbaMatch; alliance: 'red' | 'blue' }) {
  const won = match.winning_alliance === alliance;
  return (
    <div
      className={`my-1 flex items-center justify-between rounded-md px-3 py-2 ${
        alliance === 'red'
          ? 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200'
          : 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200'
      } ${won ? 'ring-2 ring-current' : ''}`}
    >
      <span className="text-sm font-medium">{match.alliances[alliance].team_keys.map(teamNumberFromKey).join(', ')}</span>
      <span className="font-bold">{match.alliances[alliance].score >= 0 ? match.alliances[alliance].score : '-'}</span>
    </div>
  );
}

function StatsTab({
  rankings,
  teams,
  matches,
  sortInfo,
  extraInfo,
  oprs,
  isLoading,
  isError,
  refetch,
}: {
  rankings: TbaRankingRow[];
  teams: TbaTeam[];
  matches: TbaMatch[];
  sortInfo: { name: string }[];
  extraInfo: { name: string }[];
  oprs?: { oprs: Record<string, number>; dprs: Record<string, number>; ccwms: Record<string, number> };
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}) {
  const rankingRows = useMemo(
    () => buildRankingRows(rankings, teams, sortInfo, extraInfo, oprs),
    [extraInfo, oprs, rankings, sortInfo, teams],
  );

  if (isLoading) return <TableSkeleton columns={4} />;
  if (isError) return <ErrorCard onRetry={refetch} />;

  const oprDistribution = [...rankingRows]
    .filter((row) => row.opr !== null)
    .sort((a, b) => (b.opr ?? 0) - (a.opr ?? 0))
    .slice(0, 30);
  const qualScores = matches
    .filter((match) => match.comp_level === 'qm' && match.alliances.red.score >= 0 && match.alliances.blue.score >= 0)
    .sort((a, b) => a.match_number - b.match_number)
    .map((match) => ({
      match: match.match_number,
      red: match.alliances.red.score,
      blue: match.alliances.blue.score,
      average: (match.alliances.red.score + match.alliances.blue.score) / 2,
    }));
  const breakdown = rankingRows
    .filter((row) => row.autoPoints !== null || row.teleopPoints !== null)
    .slice(0, 30);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ChartPanel title="OPR Distribution">
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={oprDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="teamNumber" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="opr" fill="#1f66ff" name="OPR" />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Qualification Score Trends">
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={qualScores}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="match" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="red" stroke="#d72638" strokeWidth={2} />
            <Line type="monotone" dataKey="blue" stroke="#1f66ff" strokeWidth={2} />
            <Line type="monotone" dataKey="average" stroke="#16a34a" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Auto vs Teleop Breakdown">
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={breakdown}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="teamNumber" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="autoPoints" stackId="points" fill="#f59e0b" name="Auto" />
            <Bar dataKey="teleopPoints" stackId="points" fill="#10b981" name="Teleop" />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>
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

function buildRankingRows(
  rankings: TbaRankingRow[],
  teams: TbaTeam[],
  sortInfo: Pick<TbaRankingSortInfo, 'name'>[],
  extraInfo: Pick<TbaRankingSortInfo, 'name'>[],
  oprs?: TbaOprs,
  nonWinMetrics: NonWinRpMetrics[] = [],
  rankingMode: RankingMode = 'official',
  nonWinReady = true,
): RankingTableRow[] {
  const teamMap = new Map(teams.map((team) => [team.key, team]));
  const nonWinMetricMap = new Map(nonWinMetrics.map((metric) => [metric.teamKey, metric]));

  return rankings.map((ranking) => {
    const team = teamMap.get(ranking.team_key);
    const rankingScoreIndex = findInfoIndex(sortInfo, ['ranking score', 'rp', 'ranking']);
    const autoIndex = findInfoIndex(extraInfo, ['auto']);
    const teleopIndex = findInfoIndex(extraInfo, ['teleop', 'tele']);
    const nonWinMetric = nonWinMetricMap.get(ranking.team_key);
    const rankingScore =
      rankingScoreIndex >= 0 ? ranking.sort_orders?.[rankingScoreIndex] ?? null : ranking.sort_orders?.[0] ?? null;
    const officialRp = nonWinMetric?.officialRp ?? rankingScore;
    const epa = nonWinMetric?.epa ?? oprs?.oprs[ranking.team_key] ?? null;

    return {
      key: ranking.team_key,
      rank: rankingMode === 'nonWinRP' && nonWinReady ? nonWinMetric?.nonWinRank ?? ranking.rank : ranking.rank,
      officialRank: ranking.rank,
      teamNumber: teamNumberFromKey(ranking.team_key),
      teamName: teamDisplayName(team),
      record: recordLabel(ranking.record),
      wins: ranking.record?.wins ?? 0,
      rankingScore,
      officialRp,
      winRp: nonWinReady ? nonWinMetric?.winRp ?? 0 : 0,
      nonWinRp: nonWinReady ? nonWinMetric?.nonWinRp ?? null : null,
      epa,
      opr: oprs?.oprs[ranking.team_key] ?? null,
      dpr: oprs?.dprs[ranking.team_key] ?? null,
      ccwm: oprs?.ccwms[ranking.team_key] ?? null,
      autoPoints: autoIndex >= 0 ? ranking.extra_stats?.[autoIndex] ?? null : null,
      teleopPoints: teleopIndex >= 0 ? ranking.extra_stats?.[teleopIndex] ?? null : null,
    };
  });
}

function findInfoIndex(info: { name: string }[], terms: string[]) {
  return info.findIndex((entry) => terms.some((term) => entry.name.toLowerCase().includes(term)));
}
