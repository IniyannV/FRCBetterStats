import { useQueries, useQuery } from '@tanstack/react-query';
import { tba } from '../api/tba';
import type { TbaMatch } from '../types/tba';
import { currentSeason } from '../utils/format';

export function useEvents(year = currentSeason) {
  return useQuery({
    queryKey: ['events', year],
    queryFn: () => tba.getEvents(year),
  });
}

export function useEventTeams(eventKey?: string) {
  return useQuery({
    queryKey: ['event', eventKey, 'teams'],
    queryFn: () => tba.getEventTeams(eventKey!),
    enabled: Boolean(eventKey),
  });
}

export function useEventRankings(eventKey?: string) {
  return useQuery({
    queryKey: ['event', eventKey, 'rankings'],
    queryFn: () => tba.getEventRankings(eventKey!),
    enabled: Boolean(eventKey),
  });
}

export function useEventOprs(eventKey?: string) {
  return useQuery({
    queryKey: ['event', eventKey, 'oprs'],
    queryFn: () => tba.getEventOprs(eventKey!),
    enabled: Boolean(eventKey),
  });
}

export function useEventMatches(eventKey?: string) {
  return useQuery({
    queryKey: ['event', eventKey, 'matches'],
    queryFn: () => tba.getEventMatches(eventKey!),
    enabled: Boolean(eventKey),
  });
}

export function useEventAlliances(eventKey?: string) {
  return useQuery({
    queryKey: ['event', eventKey, 'alliances'],
    queryFn: () => tba.getEventAlliances(eventKey!),
    enabled: Boolean(eventKey),
  });
}

export function useTeam(teamNumber?: string | number) {
  return useQuery({
    queryKey: ['team', teamNumber],
    queryFn: () => tba.getTeam(teamNumber!),
    enabled: Boolean(teamNumber),
  });
}

export function useTeamMedia(teamNumber?: string | number, year = currentSeason) {
  return useQuery({
    queryKey: ['team', teamNumber, 'media', year],
    queryFn: () => tba.getTeamMedia(teamNumber!, year),
    enabled: Boolean(teamNumber),
  });
}

export function useTeamEvents(teamNumber?: string | number, year = currentSeason) {
  return useQuery({
    queryKey: ['team', teamNumber, 'events', year],
    queryFn: () => tba.getTeamEvents(teamNumber!, year),
    enabled: Boolean(teamNumber),
  });
}

export function useTeamEventStatuses(teamNumber?: string | number, year = currentSeason) {
  return useQuery({
    queryKey: ['team', teamNumber, 'event-statuses', year],
    queryFn: () => tba.getTeamEventStatuses(teamNumber!, year),
    enabled: Boolean(teamNumber),
  });
}

export function useTeamEventMatches(teamNumber?: string | number, eventKeys: string[] = []) {
  return useQueries({
    queries: eventKeys.map((eventKey) => ({
      queryKey: ['team', teamNumber, 'event', eventKey, 'matches'],
      queryFn: () => tba.getTeamEventMatches(teamNumber!, eventKey),
      enabled: Boolean(teamNumber && eventKey),
    })),
    combine: (results) => ({
      data: results.flatMap((result) => result.data ?? []) as TbaMatch[],
      isLoading: results.some((result) => result.isLoading),
      isError: results.some((result) => result.isError),
      error: results.find((result) => result.error)?.error,
      refetch: () => results.forEach((result) => void result.refetch()),
    }),
  });
}

export function useTeamsPage(page: number) {
  return useQuery({
    queryKey: ['teams', page],
    queryFn: () => tba.getTeams(page),
    placeholderData: (previous) => previous,
  });
}

export function useGlobalSearch(query: string) {
  return useQueries({
    queries: [
      {
        queryKey: ['search', 'teams', query],
        queryFn: () => tba.searchTeams(query),
        enabled: query.trim().length >= 2,
      },
      {
        queryKey: ['search', 'events', query],
        queryFn: () => tba.searchEvents(query),
        enabled: query.trim().length >= 2,
      },
    ],
    combine: ([teams, events]) => ({
      teams: teams.data ?? [],
      events: events.data ?? [],
      isLoading: teams.isLoading || events.isLoading,
      isError: teams.isError || events.isError,
    }),
  });
}
