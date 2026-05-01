import type {
  TbaAlliance,
  TbaEvent,
  TbaMatch,
  TbaMedia,
  TbaOprs,
  TbaRankings,
  TbaTeam,
  TbaTeamEventStatuses,
} from '../types/tba';

const BASE_URL = 'https://www.thebluealliance.com/api/v3';
const API_KEY = import.meta.env.VITE_TBA_API_KEY as string | undefined;

export class TbaApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'TbaApiError';
  }
}

async function request<T>(path: string): Promise<T> {
  if (!API_KEY) {
    throw new TbaApiError('Missing VITE_TBA_API_KEY. Add it to your .env file and restart Vite.');
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'X-TBA-Auth-Key': API_KEY,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new TbaApiError(`TBA request failed: ${response.status} ${response.statusText}`, response.status);
  }

  return response.json() as Promise<T>;
}

export const tba = {
  getTeams: (page: number) => request<TbaTeam[]>(`/teams/${page}`),
  getTeam: (teamNumber: number | string) => request<TbaTeam>(`/team/frc${teamNumber}`),
  getTeamMedia: (teamNumber: number | string, year: number) =>
    request<TbaMedia[]>(`/team/frc${teamNumber}/media/${year}`),
  getTeamEvents: (teamNumber: number | string, year: number) =>
    request<TbaEvent[]>(`/team/frc${teamNumber}/events/${year}`),
  getTeamEventStatuses: (teamNumber: number | string, year: number) =>
    request<TbaTeamEventStatuses>(`/team/frc${teamNumber}/events/${year}/statuses`),
  getTeamEventMatches: (teamNumber: number | string, eventKey: string) =>
    request<TbaMatch[]>(`/team/frc${teamNumber}/event/${eventKey}/matches`),
  getEvents: (year: number) => request<TbaEvent[]>(`/events/${year}`),
  getEventTeams: (eventKey: string) => request<TbaTeam[]>(`/event/${eventKey}/teams`),
  getEventRankings: (eventKey: string) => request<TbaRankings>(`/event/${eventKey}/rankings`),
  getEventOprs: (eventKey: string) => request<TbaOprs>(`/event/${eventKey}/oprs`),
  getEventMatches: (eventKey: string) => request<TbaMatch[]>(`/event/${eventKey}/matches`),
  getEventAlliances: (eventKey: string) => request<TbaAlliance[]>(`/event/${eventKey}/alliances`),
  searchTeams: (query: string) => request<TbaTeam[]>(`/search/teams?q=${encodeURIComponent(query)}`),
  searchEvents: (query: string) => request<TbaEvent[]>(`/search/events?q=${encodeURIComponent(query)}`),
};
