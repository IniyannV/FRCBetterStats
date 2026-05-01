import type { TbaMatch, TbaOprs, TbaRankingRow, TbaRankingSortInfo } from '../types/tba';

export interface NonWinRpMetrics {
  teamKey: string;
  officialRp: number | null;
  winRp: number;
  nonWinRp: number | null;
  epa: number | null;
  nonWinRank: number;
}

const WIN_RP_VALUE = 3;
const RANKING_SCORE_TERMS = ['ranking score', 'rp', 'ranking'];

export function calculateWinRpByTeam(matches: TbaMatch[]): Record<string, number> {
  return matches.reduce<Record<string, number>>((winRpByTeam, match) => {
    if (match.comp_level !== 'qm' || !match.winning_alliance) return winRpByTeam;

    const winningTeamKeys = match.alliances[match.winning_alliance].team_keys;
    winningTeamKeys.forEach((teamKey) => {
      winRpByTeam[teamKey] = (winRpByTeam[teamKey] ?? 0) + WIN_RP_VALUE;
    });

    return winRpByTeam;
  }, {});
}

export function extractTotalRankingPoints(
  ranking: TbaRankingRow,
  sortInfo: Pick<TbaRankingSortInfo, 'name'>[],
): number | null {
  const rankingScoreIndex = findInfoIndex(sortInfo, RANKING_SCORE_TERMS);
  const rawRankingScore =
    rankingScoreIndex >= 0 ? ranking.sort_orders?.[rankingScoreIndex] : ranking.sort_orders?.[0];

  if (rawRankingScore === undefined || rawRankingScore === null) return null;

  const matchesPlayed = ranking.matches_played ?? 0;
  const normalizedScore =
    matchesPlayed > 0 && isLikelyAverageRankingScore(rawRankingScore)
      ? rawRankingScore * matchesPlayed
      : rawRankingScore;

  return roundRankingPoints(normalizedScore);
}

export function calculateNonWinRp(officialRp: number | null, winRp: number): number | null {
  if (officialRp === null) return null;
  return roundRankingPoints(Math.max(officialRp - winRp, 0));
}

export function buildNonWinRpMetrics(
  rankings: TbaRankingRow[],
  matches: TbaMatch[],
  sortInfo: Pick<TbaRankingSortInfo, 'name'>[],
  oprs?: Pick<TbaOprs, 'oprs'>,
): NonWinRpMetrics[] {
  const winRpByTeam = calculateWinRpByTeam(matches);
  const metrics = rankings.map((ranking) => {
    const officialRp = extractTotalRankingPoints(ranking, sortInfo);
    const winRp = winRpByTeam[ranking.team_key] ?? 0;

    return {
      teamKey: ranking.team_key,
      officialRp,
      winRp,
      nonWinRp: calculateNonWinRp(officialRp, winRp),
      epa: oprs?.oprs[ranking.team_key] ?? null,
      nonWinRank: 0,
    };
  });

  return applyNonWinRanks(metrics);
}

function applyNonWinRanks(metrics: Omit<NonWinRpMetrics, 'nonWinRank'>[] | NonWinRpMetrics[]): NonWinRpMetrics[] {
  const rankedMetrics = [...metrics].sort(compareNonWinMetrics);
  let previous: Omit<NonWinRpMetrics, 'nonWinRank'> | null = null;
  let previousRank = 0;

  const ranksByTeam = new Map<string, number>();
  rankedMetrics.forEach((metric, index) => {
    const rank =
      previous &&
      metric.nonWinRp === previous.nonWinRp &&
      metric.epa === previous.epa
        ? previousRank
        : index + 1;

    ranksByTeam.set(metric.teamKey, rank);
    previous = metric;
    previousRank = rank;
  });

  return metrics.map((metric) => ({
    ...metric,
    nonWinRank: ranksByTeam.get(metric.teamKey) ?? 0,
  }));
}

function compareNonWinMetrics(left: Omit<NonWinRpMetrics, 'nonWinRank'>, right: Omit<NonWinRpMetrics, 'nonWinRank'>) {
  return (
    compareNullableDescending(left.nonWinRp, right.nonWinRp) ||
    compareNullableDescending(left.epa, right.epa) ||
    left.teamKey.localeCompare(right.teamKey, undefined, { numeric: true })
  );
}

function compareNullableDescending(left: number | null, right: number | null) {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return right - left;
}

function findInfoIndex(info: Pick<TbaRankingSortInfo, 'name'>[], terms: string[]) {
  return info.findIndex((entry) => terms.some((term) => entry.name.toLowerCase().includes(term)));
}

function isLikelyAverageRankingScore(value: number) {
  return value >= 0 && value <= 6;
}

function roundRankingPoints(value: number) {
  return Math.round(value * 1000) / 1000;
}
