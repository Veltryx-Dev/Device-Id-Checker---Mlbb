export interface PlayerData {
  nickname: string;
  player_id: number | string;
  server: number | string;
  level: number;
  ban_status: string;
  ban_end: string;
  skin_count: number;
  last_login: string;
  last_login_country: string;
  create_country: string;
  hero_count: number;
  location: string;
  high_rank: string;
  current_rank: string;
  collector_tier: string;
  squad: string;
  squad_id: string;
  affinity: string;
  total_battles: number;
  win_rate: string;
  last_match?: {
    hero_name: string;
    prev: string[];
  };
}

export interface CheckResult {
  status: "registered" | "unregistered" | "invalid";
  device_id: string;
  error?: string;
  player_data?: PlayerData;
}

export type TabMode = "stream" | "batch" | "generator" | "history";
