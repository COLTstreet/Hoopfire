// Shared Game Schedule interfaces
export interface NBAGameSchedule {
  HomeTeam: string;
  AwayTeam: string;
  DateTime: string;
}

export interface NCAAGameSchedule {
  GlobalHomeTeamID: number;
  GlobalAwayTeamID: number;
  DateTime: string;
  Status: string;
}

