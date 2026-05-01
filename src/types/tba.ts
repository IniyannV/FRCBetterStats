export interface TbaTeam {
  key: string;
  team_number: number;
  nickname: string | null;
  name: string;
  school_name: string | null;
  city: string | null;
  state_prov: string | null;
  country: string | null;
  rookie_year: number | null;
  website?: string | null;
}

export interface TbaEvent {
  key: string;
  name: string;
  short_name: string | null;
  event_code: string;
  event_type: number;
  event_type_string: string;
  district?: { abbreviation: string; display_name: string; key: string; year: number } | null;
  city: string | null;
  state_prov: string | null;
  country: string | null;
  start_date: string;
  end_date: string;
  year: number;
}

export interface TbaRankingSortInfo {
  name: string;
  precision: number;
}

export interface TbaRankingRow {
  rank: number;
  team_key: string;
  record?: { wins: number; losses: number; ties: number };
  sort_orders?: number[];
  matches_played?: number;
  dq?: number;
  qual_average?: number | null;
  extra_stats?: number[];
}

export interface TbaRankings {
  rankings: TbaRankingRow[];
  sort_order_info?: TbaRankingSortInfo[];
  extra_stats_info?: TbaRankingSortInfo[];
}

export interface TbaOprs {
  oprs: Record<string, number>;
  dprs: Record<string, number>;
  ccwms: Record<string, number>;
}

export interface TbaMatchAlliance {
  team_keys: string[];
  surrogate_team_keys?: string[];
  dq_team_keys?: string[];
  score: number;
}

export interface TbaMatch {
  key: string;
  comp_level: 'qm' | 'ef' | 'qf' | 'sf' | 'f';
  set_number: number;
  match_number: number;
  alliances: {
    red: TbaMatchAlliance;
    blue: TbaMatchAlliance;
  };
  winning_alliance: 'red' | 'blue' | '';
  time: number | null;
  predicted_time: number | null;
  actual_time: number | null;
}

export interface TbaAlliance {
  name: string;
  backup?: { in: string; out: string } | null;
  declines?: string[];
  picks: string[];
  status?: {
    current_level_record?: { wins: number; losses: number; ties: number };
    playoff_average?: number;
    record?: { wins: number; losses: number; ties: number };
    status?: string;
    level?: string;
  };
}

export interface TbaMedia {
  type: string;
  foreign_key: string;
  direct_url?: string | null;
  view_url?: string | null;
  details?: Record<string, unknown>;
  preferred?: boolean;
}

export interface TbaTeamEventStatus {
  qual?: {
    ranking?: TbaRankingRow & {
      sort_orders?: number[];
    };
    sort_order_info?: TbaRankingSortInfo[];
  } | null;
  alliance?: {
    name: string;
    number: number;
    pick: number;
  } | null;
  playoff?: {
    status: string;
    level: string;
    current_level_record?: { wins: number; losses: number; ties: number };
    record?: { wins: number; losses: number; ties: number };
  } | null;
  overall_status_str?: string;
}

export type TbaTeamEventStatuses = Record<string, TbaTeamEventStatus>;
