// Shared Game Schedule interfaces
export interface NBAGameSchedule {
  HomeTeam: string;
  AwayTeam: string;
  DateTime: string;
  Status: string;
  HomeTeamScore?: number | null;
  AwayTeamScore?: number | null;
  GameID?: number;
}

export interface NCAAGameSchedule {
  GlobalHomeTeamID: number;
  GlobalAwayTeamID: number;
  DateTime: string;
  Status: string;
  HomeTeamScore?: number | null;
  AwayTeamScore?: number | null;
  GameID?: number;
}

