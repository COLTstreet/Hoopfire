import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { FormsModule } from '@angular/forms';

import { ConfirmationService, MessageService } from 'primeng/api';
import { Card } from 'primeng/card';
import { Chip } from 'primeng/chip';
import { combineLatest } from 'rxjs';

declare var stringSimilarity: any

// Add interfaces for type safety
interface Team {
  team: string;
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
  [key: string]: any;
}

interface Matchup {
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
  location?: {
    City?: string;
    State?: string;
    Name?: string;
  };
  gameTime: string;
  remove?: string;
  leftTeamLogoUrl?: string;
  rightTeamLogoUrl?: string;
}

interface GameSchedule {
  GlobalHomeTeamID: number;
  GlobalAwayTeamID: number;
  DateTime: string;
  Status: string;
}

@Component({
    selector: 'app-ncaa',
    imports: [FormsModule, Card, Chip],
    templateUrl: './ncaa.component.html',
    styleUrl: './ncaa.component.scss',
    providers: [ConfirmationService, MessageService]
})
export class NCAAComponent implements OnInit {

  // Constants
  private readonly HOME_ADVANTAGE = 0.010;
  private readonly PYTHAGOREAN_EXPONENT = 10.25;
  private readonly HOME_SCORE_ADJUSTMENT = 3.2;
  private readonly HIGH_SIMILARITY_THRESHOLD = 0.70;
  private readonly LOW_SIMILARITY_THRESHOLD = 0.35;

  allFirestoreTeams: Team[] = []
  leftTeamsList: Team[] = []
  rightTeamsList: Team[] = []

  avgPos: number | undefined
  avgOff: number | undefined

  leftHome: boolean | undefined
  rightHome: boolean | undefined
  neutral: boolean = true

  leftScore: number | undefined
  leftWinChance: number | undefined
  leftWinner: boolean | undefined

  rightScore: number | undefined
  rightWinChance: number | undefined
  rightWinner: boolean | undefined

  spread: string | undefined
  winner: Team | undefined
  confidenceScore: number | undefined
  overUnder: number | undefined
  totalPoints: number | undefined

  selectedLeftTeam: Team | undefined;
  selectedRightTeam: Team | undefined;

  allTeamSeasonStats: any[] = []
  allTeams: Team[] = []
  todaysGames: GameSchedule[] = []

  matchups: Matchup[] = [];

  gridApi: any;
  gridColumnApi: any;

  conferenceMap = new Map<string, string>()

  constructor(
    public _dataService: DataService, 
    private confirmationService: ConfirmationService, 
    private messageService: MessageService
  ) {
    this.neutral = true;
    this.initializeConferenceMap();
    this.getNCAAData();
  }

  ngOnInit() {
  }

  private initializeConferenceMap(): void {
    this.conferenceMap.set("American Athletic", "Amer");
    this.conferenceMap.set("American", "Amer");
    this.conferenceMap.set("Atlantic Coast", "ACC");
    this.conferenceMap.set("Big Ten", "B10");
    this.conferenceMap.set("Big 12", "B12");
    this.conferenceMap.set("Conference USA", "CUSA");
    this.conferenceMap.set("Mid-American", "MAC");
    this.conferenceMap.set("Mountain West", "MWC");
    this.conferenceMap.set("Pac-12", "WCC");
    this.conferenceMap.set("Southeastern", "SEC");
    this.conferenceMap.set("Sun Belt", "SB");
    this.conferenceMap.set("America East", "AE");
    this.conferenceMap.set("Atlantic Sun", "ASUN");
    this.conferenceMap.set("Atlantic 10", "A-10");
    this.conferenceMap.set("Big East", "BE");
    this.conferenceMap.set("Big West", "BW");
    this.conferenceMap.set("Coastal Athletic Association", "CAA");
    this.conferenceMap.set("Horizon League", "Horz");
    this.conferenceMap.set("Metro Atlantic Athletic", "MAAC");
    this.conferenceMap.set("Missouri Valley", "MVC");
    this.conferenceMap.set("Mountain Pacific Sports Federation", "MPSF");
    this.conferenceMap.set("Summit", "Sum");
    this.conferenceMap.set("West Coast", "WCC");
    this.conferenceMap.set("Western Athletic", "WAC");
    this.conferenceMap.set("Southwestern Athletic", "SWAC");
    this.conferenceMap.set("Patriot League", "PL");
    this.conferenceMap.set("Southland", "Slnd");
    this.conferenceMap.set("Mid-Eastern", "MEAC");
    this.conferenceMap.set("Northeast", "NEC");
    this.conferenceMap.set("Ohio Valley", "OVC");
    this.conferenceMap.set("Southern", "SC");
    this.conferenceMap.set("Big Sky", "BSky");
    this.conferenceMap.set("Big South", "BSth");
    this.conferenceMap.set("Ivy League", "Ivy");
  }

  getNCAAData() {
    combineLatest([
      this._dataService.getNCAAMAnalytics(),
      this._dataService.getAllNCAAMTeamSeasonStats(),
      this._dataService.getNCAAMTeams(),
      this._dataService.getTodaysNCAAMSchedule(),
    ]).subscribe({
      next: ([firestoreData, ncaaTeamStatsData, ncaaTeamsData, scheduleData]: any) => {
        this.allFirestoreTeams = firestoreData;
        this.allTeamSeasonStats = ncaaTeamStatsData;
        this.allTeams = ncaaTeamsData.sort((a: Team, b: Team) => 
          (a.School || '').localeCompare(b.School || '')
        );
        this.todaysGames = scheduleData;

        this.calculateAverages();
        this.calculateTodaysGames();
      },
      error: (error: any) => {
        console.error('Error fetching NCAA data:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load NCAA data'
        });
      }
    });
  }

  calculateAverages() {
    if (!this.allFirestoreTeams || this.allFirestoreTeams.length === 0) {
      return;
    }

    let avgPosSum = 0;
    let avgOffSum = 0;
    let count = 0;

    for (const ele of this.allFirestoreTeams) {
      if (ele.team !== "Team" && ele.adjT && ele.adjO) {
        avgPosSum += Number(ele.adjT);
        avgOffSum += Number(ele.adjO);
        count++;
      }
    }

    if (count > 0) {
      this.avgPos = avgPosSum / count;
      this.avgOff = avgOffSum / count;
    }
  }

  calculateTodaysGames() {
    this.matchups = [];
    const todaysGames = this.todaysGames.filter((ele: GameSchedule) => ele.Status !== "Final");
    const todaysMatchups: Array<[Team, Team, string]> = [];

    for (const game of todaysGames) {
      const homeTeam = this.setSelectedTeam(game.GlobalHomeTeamID);
      const awayTeam = this.setSelectedTeam(game.GlobalAwayTeamID);

      if (homeTeam && awayTeam) {
        const gameTime = new Date(game.DateTime).toLocaleTimeString();
        todaysMatchups.push([homeTeam, awayTeam, gameTime]);
      }
    }

    if (todaysMatchups.length > 0) {
      for (const matchup of todaysMatchups) {
        this.selectedLeftTeam = matchup[0];
        this.selectedRightTeam = matchup[1];

        this.calculateOdds();
        this.addMatchup(matchup[2]);
      }
    }
    
    // Reset state
    this.leftWinner = false;
    this.rightWinner = false;
    this.spread = '';
    this.confidenceScore = undefined;
  }

  addMatchup(gameTime: string) {
    if (!this.selectedLeftTeam || !this.selectedRightTeam) {
      return;
    }

    const matchup: Matchup = {
      "leftTeam": this.selectedLeftTeam.team,
      "leftRecord": this.selectedLeftTeam.winLoss || '',
      "leftScore": this.leftScore || 0,
      "leftSpread": "",
      "rightSpread": "",
      "totalPoints": this.totalPoints || 0,
      "rightScore": this.rightScore || 0,
      "rightRecord": this.selectedRightTeam.winLoss || '',
      "rightTeam": this.selectedRightTeam.team,
      "confidence": (this.confidenceScore || 0) + "%",
      "location": this.selectedLeftTeam.homeTeam 
        ? this.selectedLeftTeam.Stadium 
        : this.selectedRightTeam.Stadium,
      "gameTime": gameTime || "User Generated",
      "remove": "",
      "leftTeamLogoUrl": this.selectedLeftTeam.TeamLogoUrl,
      "rightTeamLogoUrl": this.selectedRightTeam.TeamLogoUrl
    };

    // Calculate spreads
    if (matchup.leftScore > matchup.rightScore) {
      matchup.leftSpread = this.spread || "";
      matchup.rightSpread = (this.spread || "").replace("-", "+");
    } else {
      matchup.rightSpread = this.spread || "";
      matchup.leftSpread = (this.spread || "").replace("-", "+");
    }

    this.matchups.push(matchup);
  }

  setSelectedTeam(id: number): Team | null {
    const teamData = this.allTeams.find((team: Team) => team.GlobalTeamID === id);
    
    if (!teamData) {
      return null;
    }

    let firestoreTeam: Team | undefined;
    const matchingTeams = this.allFirestoreTeams.filter((tm: Team) => 
      tm.team.toLowerCase().includes(teamData.School?.toLowerCase() || '')
    );
    
    if (matchingTeams.length === 1) {
      firestoreTeam = matchingTeams[0];
    } else if (matchingTeams.length > 1) {
      // Try to match by conference and wins
      const conferenceCode = this.conferenceMap.get(teamData.Conference || '');
      const teamWins = teamData.Wins?.toString();
      
      firestoreTeam = matchingTeams.find((tm: Team) => 
        tm.conference === conferenceCode && 
        tm.winLoss?.split("-")[0] === teamWins
      );
    }

    // If still no match, try fuzzy matching
    if (!firestoreTeam && teamData.School) {
      firestoreTeam = this.findTeamByFuzzyMatch(teamData);
    }

    if (firestoreTeam) {
      const team: Team = {
        ...teamData,
        ...firestoreTeam,
        homeTeam: true
      };
      return team;
    }

    return null;
  }

  private findTeamByFuzzyMatch(teamData: Team): Team | undefined {
    if (!teamData.School || !teamData.Conference) {
      return undefined;
    }

    let schoolName = teamData.School.replace("College", '').trim();
    schoolName = schoolName.replace("University", '').trim();
    const schoolRecord = `${teamData.Wins}-${teamData.Losses}`;
    const conferenceCode = this.conferenceMap.get(teamData.Conference);

    if (!conferenceCode) {
      return undefined;
    }

    // Special cases
    if (schoolName === "UIC") {
      return this.allFirestoreTeams.find((t: Team) => t.team.includes("Illinois Chicago"));
    }
    if (schoolName === "UAPB") {
      return this.allFirestoreTeams.find((t: Team) => t.team.includes("Arkansas Pine Bluff"));
    }

    // Fuzzy matching
    for (const tm of this.allFirestoreTeams) {
      const similarity = stringSimilarity.compareTwoStrings(schoolName, tm.team);
      
      if (tm.conference?.toLowerCase() === conferenceCode.toLowerCase()) {
        if (similarity > this.HIGH_SIMILARITY_THRESHOLD) {
          return tm;
        }
        if (similarity > this.LOW_SIMILARITY_THRESHOLD && tm.winLoss === schoolRecord) {
          return tm;
        }
      }
    }

    return undefined;
  }

  calculateOdds() {
    if (!this.selectedLeftTeam || !this.selectedRightTeam) {
      return;
    }

    if (!this.avgPos || !this.avgOff) {
      console.warn('Averages not calculated yet');
      return;
    }

    let rightTeam: Team, leftTeam: Team;
    
    // Determine home/away teams
    if (this.leftHome || this.neutral) {
      leftTeam = this.selectedLeftTeam;
      rightTeam = this.selectedRightTeam;
    } else if (this.rightHome) {
      leftTeam = this.selectedRightTeam;
      rightTeam = this.selectedLeftTeam;
    } else {
      leftTeam = this.selectedLeftTeam;
      rightTeam = this.selectedRightTeam;
    }

    // Validate required stats
    if (!leftTeam.adjO || !leftTeam.adjD || !rightTeam.adjO || !rightTeam.adjD) {
      console.warn('Missing required team statistics');
      return;
    }

    const adjHomeOff = Number(leftTeam.adjO);
    const adjHomeDef = Number(leftTeam.adjD);
    const adjAwayOff = Number(rightTeam.adjO);
    const adjAwayDef = Number(rightTeam.adjD);

    // Calculate win probabilities
    const pythExp = this.PYTHAGOREAN_EXPONENT;
    const adjHomePyth = Math.pow(adjHomeOff, pythExp) / 
      (Math.pow(adjHomeOff, pythExp) + Math.pow(adjHomeDef, pythExp));
    const adjAwayPyth = Math.pow(adjAwayOff, pythExp) / 
      (Math.pow(adjAwayOff, pythExp) + Math.pow(adjAwayDef, pythExp));

    const leftWinChance = (adjHomePyth - adjHomePyth * adjAwayPyth) / 
      (adjHomePyth + adjAwayPyth - 2 * adjHomePyth * adjAwayPyth);
    
    this.leftWinChance = Number((leftWinChance * 100).toFixed(0));
    this.rightWinChance = Number(((1 - leftWinChance) * 100).toFixed(0));

    // Calculate scores
    const adjPos = ((rightTeam.adjT || 0) / this.avgPos) * 
      ((leftTeam.adjT || 0) / this.avgPos) * this.avgPos;

    let rightScoreDecimal = (((adjAwayOff / this.avgOff) * (adjHomeDef / this.avgOff)) * 
      this.avgOff * (adjPos / 100));
    this.rightScore = Number(rightScoreDecimal.toFixed(0));
    
    let leftScoreDecimal = (((adjHomeOff / this.avgOff) * (adjAwayDef / this.avgOff)) * 
      this.avgOff * (adjPos / 100));

    if (!this.neutral) {
      leftScoreDecimal = leftScoreDecimal + this.HOME_SCORE_ADJUSTMENT;
    }
    
    this.leftScore = Number(leftScoreDecimal.toFixed(0));

    // Calculate spread - FIXED BUG
    const decSpread = Math.abs(leftScoreDecimal - rightScoreDecimal);
    const spreadValue = (Math.round(decSpread * 2) / 2).toFixed(1);

    if (leftScoreDecimal > rightScoreDecimal) {
      this.spread = "-" + spreadValue;
      this.winner = leftTeam;
      this.confidenceScore = this.leftWinChance;
    } else {
      this.spread = "-" + spreadValue;
      this.winner = rightTeam;
      this.confidenceScore = this.rightWinChance;
    }

    // Set winner flags and scores - FIXED BUG
    if (this.leftHome || this.neutral) {
      this.leftWinner = leftScoreDecimal > rightScoreDecimal;
      this.rightWinner = !this.leftWinner;
    } else if (this.rightHome) {
      // Swap scores correctly
      const tempLeftScore = this.leftScore;
      this.leftScore = this.rightScore;
      this.rightScore = tempLeftScore;
      
      this.leftWinner = rightScoreDecimal > leftScoreDecimal;
      this.rightWinner = !this.leftWinner;
    }

    this.overUnder = Number((rightScoreDecimal + leftScoreDecimal).toFixed(2));
    this.totalPoints = (this.leftScore || 0) + (this.rightScore || 0);
  }

  getConfidenceClass(confidence: string): string {
    const numericValue = parseFloat(confidence.replace('%', ''));
    
    if (numericValue >= 70) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (numericValue >= 50) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else {
      return 'bg-red-100 text-red-800 border-red-200';
    }
  }
}