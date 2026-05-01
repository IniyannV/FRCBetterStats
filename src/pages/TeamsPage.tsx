import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorCard from '../components/ErrorCard';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { useTeamsPage } from '../hooks/useTbaQueries';
import { locationLabel, teamDisplayName } from '../utils/format';

export default function TeamsPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [rookieMin, setRookieMin] = useState('');
  const [rookieMax, setRookieMax] = useState('');
  const teamsQuery = useTeamsPage(page);

  const filteredTeams = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (teamsQuery.data ?? []).filter((team) => {
      const haystack = `${team.team_number} ${team.nickname} ${team.name} ${team.city} ${team.state_prov} ${team.country}`.toLowerCase();
      const matchesSearch = !term || haystack.includes(term);
      const matchesRegion =
        !region ||
        team.state_prov?.toLowerCase().includes(region.toLowerCase()) ||
        team.country?.toLowerCase().includes(region.toLowerCase());
      const rookieYear = team.rookie_year ?? 0;
      const matchesRookieMin = !rookieMin || rookieYear >= Number(rookieMin);
      const matchesRookieMax = !rookieMax || rookieYear <= Number(rookieMax);
      return matchesSearch && matchesRegion && matchesRookieMin && matchesRookieMax;
    });
  }, [region, rookieMax, rookieMin, search, teamsQuery.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-frc-blue">Teams</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">FRC Team Directory</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn h-10 w-10 px-0" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-24 text-center text-sm font-medium">Page {page}</span>
          <button className="btn h-10 w-10 px-0" onClick={() => setPage((value) => value + 1)}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teams" />
        <input className="input" value={region} onChange={(event) => setRegion(event.target.value)} placeholder="State or country" />
        <input className="input" type="number" value={rookieMin} onChange={(event) => setRookieMin(event.target.value)} placeholder="Rookie year min" />
        <input className="input" type="number" value={rookieMax} onChange={(event) => setRookieMax(event.target.value)} placeholder="Rookie year max" />
      </div>

      {teamsQuery.isLoading ? <CardSkeleton count={12} /> : null}
      {teamsQuery.isError ? <ErrorCard onRetry={() => void teamsQuery.refetch()} /> : null}

      {!teamsQuery.isLoading && !teamsQuery.isError ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTeams.map((team) => (
            <Link key={team.key} to={`/teams/${team.team_number}`} className="panel rounded-lg p-5 transition hover:-translate-y-0.5">
              <h2 className="text-lg font-semibold">Team {team.team_number}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{teamDisplayName(team)}</p>
              <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                {locationLabel(team)}
              </p>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
