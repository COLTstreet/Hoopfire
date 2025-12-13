// Shared Matchup interface
export interface Matchup {
  leftTeam: string;
  leftRecord: string;
  leftScore: number;
  leftSpread: string;
  rightSpread: string;
  totalPoints: number;
  rightScore: number;
  rightRecord: string;
  rightTeam: string;
  confidence: string;
  gameTime: string;
  remove?: string;
  leftWikipediaLogoUrl?: string;
  rightWikipediaLogoUrl?: string;
  leftTeamLogoUrl?: string;
  rightTeamLogoUrl?: string;
  isFinished?: boolean;
  location?: {
    City?: string;
    State?: string;
    Name?: string;
  };
}

