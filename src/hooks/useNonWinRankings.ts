import { useMemo } from 'react';
import type { TbaMatch, TbaOprs, TbaRankingRow, TbaRankingSortInfo } from '../types/tba';
import { buildNonWinRpMetrics } from '../utils/nonWinRp';

export function useNonWinRankings({
  rankings,
  matches,
  sortInfo,
  oprs,
}: {
  rankings: TbaRankingRow[];
  matches: TbaMatch[];
  sortInfo: Pick<TbaRankingSortInfo, 'name'>[];
  oprs?: TbaOprs;
}) {
  return useMemo(
    () => buildNonWinRpMetrics(rankings, matches, sortInfo, oprs),
    [matches, oprs, rankings, sortInfo],
  );
}
