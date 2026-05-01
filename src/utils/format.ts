import type { TbaEvent, TbaMatch, TbaTeam } from '../types/tba';

export const currentSeason = new Date().getFullYear();

export function teamNumberFromKey(key: string) {
  return key.replace('frc', '');
}

export function teamDisplayName(team?: TbaTeam) {
  if (!team) return 'Unknown team';
  return team.nickname || team.name || `Team ${team.team_number}`;
}

export function locationLabel(item: Pick<TbaTeam | TbaEvent, 'city' | 'state_prov' | 'country'>) {
  return [item.city, item.state_prov, item.country].filter(Boolean).join(', ') || 'Location unavailable';
}

export function dateRange(startDate?: string, endDate?: string) {
  if (!startDate) return 'Date unavailable';
  const start = new Date(`${startDate}T00:00:00`);
  const end = endDate ? new Date(`${endDate}T00:00:00`) : start;
  const formatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
  if (startDate === endDate) return formatter.format(start);
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

export function matchLabel(match: TbaMatch) {
  const prefix = {
    qm: 'Qual',
    ef: 'Octofinal',
    qf: 'Quarterfinal',
    sf: 'Semifinal',
    f: 'Final',
  }[match.comp_level];

  if (match.comp_level === 'qm') return `${prefix} ${match.match_number}`;
  return `${prefix} ${match.set_number}-${match.match_number}`;
}

export function formatNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return value.toFixed(digits);
}

export function recordLabel(record?: { wins: number; losses: number; ties: number }) {
  if (!record) return '-';
  return `${record.wins}-${record.losses}-${record.ties}`;
}
