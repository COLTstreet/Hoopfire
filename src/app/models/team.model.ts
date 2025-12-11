// Shared Team interfaces for NBA and NCAA
export interface BaseTeam {
  team: string;
  [key: string]: any;
}

export interface NBATeam extends BaseTeam {
  City?: string;
  Name?: string;
  Key?: string;
  WikipediaLogoUrl?: string;
  oRtg?: number;
  dRtg?: number;
  pace?: number;
  wins?: number;
  losses?: number;
}

export interface NCAATeam extends BaseTeam {
  School?: string;
  Conference?: string;
  GlobalTeamID?: number;
  TeamLogoUrl?: string;
  adjO?: number;
  adjD?: number;
  adjT?: number;
  conference?: string;
  winLoss?: string;
  Stadium?: {
    City?: string;
    State?: string;
    Name?: string;
  };
  homeTeam?: boolean;
  Wins?: number;
  Losses?: number;
}

export type Team = NBATeam | NCAATeam;

