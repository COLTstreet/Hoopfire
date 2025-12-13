import { Component } from '@angular/core';
import { DataService } from '../../services/data.service';
import { OddsCalculationService } from '../../services/odds-calculation.service';
import { UtilsService } from '../../services/utils.service';
import { FormsModule } from '@angular/forms';

import { ConfirmationService, MessageService } from 'primeng/api';
import { Card } from 'primeng/card';
import { Chip } from 'primeng/chip';
import { combineLatest } from 'rxjs';

import { NBATeam } from '../../models/team.model';
import { Matchup } from '../../models/matchup.model';
import { NBAGameSchedule } from '../../models/game-schedule.model';

@Component({
    selector: 'app-nba',
    imports: [FormsModule, Card, Chip],
    templateUrl: './nba.component.html',
    styleUrl: './nba.component.scss',
    providers: [ConfirmationService, MessageService]
})
export class NbaComponent {

  allFirestoreTeams: NBATeam[] = []

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
  winner: NBATeam | undefined
  confidenceScore: number | undefined
  overUnder: number | undefined
  totalPoints: number | undefined

  selectedLeftTeam: NBATeam | undefined;
  selectedRightTeam: NBATeam | undefined;

  allTeams: NBATeam[] = []
  todaysGames: NBAGameSchedule[] = []
  finishedGames: NBAGameSchedule[] = []
  finishedMatchups: Matchup[] = []  // Add this
  allMatchups: Matchup[] = []  // Combined array

  matchups: Matchup[] = [];

  constructor(
    public _dataService: DataService,
    private oddsService: OddsCalculationService,
    public utilsService: UtilsService
  ) {
    this.neutral = true;
    this.getNBAData();
  }

  getNBAData() {
    combineLatest([
      this._dataService.getNBAAnalytics(),
      this._dataService.getNBATeams(),
      this._dataService.getTodaysNBASchedule(),
    ]).subscribe({
      next: ([firestoreData, nbaData, scheduleData]: any) => {
        this.allFirestoreTeams = firestoreData;
        this.allTeams = nbaData.sort((a: NBATeam, b: NBATeam) =>
          (a.Name || '').localeCompare(b.Name || '')
        );
        this.todaysGames = scheduleData;

        this.calculateNBAAverages();
        this.calculateTodaysGames();
      },
      error: (error: any) => {
        console.error('Error fetching NBA data:', error);
      }
    });
  }

  calculateNBAAverages() {
    if (!this.allFirestoreTeams || this.allFirestoreTeams.length === 0) {
      return;
    }

    const leagueAverage = this.allFirestoreTeams.find((d: NBATeam) => d.team === "League Average");
    
    if (leagueAverage) {
      this.avgPos = leagueAverage.pace;
      this.avgOff = leagueAverage.oRtg;
    }
  }

  calculateTodaysGames() {
    this.matchups = [];
    this.finishedMatchups = [];  // Reset finished matchups
    
    this.finishedGames = this.todaysGames.filter((ele: NBAGameSchedule) => ele.Status === "Final");
    this.processFinishedGames();

    const todaysGames = this.todaysGames.filter((ele: NBAGameSchedule) => ele.Status !== "Final");
    const todaysMatchups: Array<[NBATeam, NBATeam, string]> = [];

    for (const game of todaysGames) {
      const homeTeamData = this.allTeams.find((team: NBATeam) => 
        team.Key?.toLowerCase().includes(game.HomeTeam.toLowerCase())
      );
      
      const awayTeamData = this.allTeams.find((team: NBATeam) => 
        team.Key?.toLowerCase().includes(game.AwayTeam.toLowerCase())
      );

      if (!homeTeamData || !awayTeamData) {
        continue;
      }

      const homeTeamName = `${homeTeamData.City} ${homeTeamData.Name}`.toLowerCase();
      const awayTeamName = `${awayTeamData.City} ${awayTeamData.Name}`.toLowerCase();

      const homeFirestoreTeam = this.allFirestoreTeams.find((tm: NBATeam) => 
        tm.team.toLowerCase().includes(homeTeamName)
      );
      
      const awayFirestoreTeam = this.allFirestoreTeams.find((tm: NBATeam) => 
        tm.team.toLowerCase().includes(awayTeamName)
      );

      if (!homeFirestoreTeam || !awayFirestoreTeam) {
        continue;
      }

      const leftTeam: NBATeam = {
        ...homeTeamData,
        ...homeFirestoreTeam
      };

      const rightTeam: NBATeam = {
        ...awayTeamData,
        ...awayFirestoreTeam
      };

      const gameTime = new Date(game.DateTime).toLocaleTimeString();
      todaysMatchups.push([leftTeam, rightTeam, gameTime]);
    }

    if (todaysMatchups.length > 0) {
      for (const matchup of todaysMatchups) {
        this.selectedLeftTeam = matchup[0];
        this.selectedRightTeam = matchup[1];

        this.calculateOdds();
        this.addMatchup(matchup[2]);
      }
    }
    
    // Combine finished and predictive games - ADD THIS LINE
    this.allMatchups = [...this.finishedMatchups, ...this.matchups];
    
    // Reset state
    this.leftWinner = false;
    this.rightWinner = false;
    this.spread = '';
    this.confidenceScore = undefined;
  }

  processFinishedGames() {
    for (const game of this.finishedGames) {
      const homeTeamData = this.allTeams.find((team: NBATeam) => 
        team.Key?.toLowerCase().includes(game.HomeTeam.toLowerCase())
      );
      
      const awayTeamData = this.allTeams.find((team: NBATeam) => 
        team.Key?.toLowerCase().includes(game.AwayTeam.toLowerCase())
      );

      if (!homeTeamData || !awayTeamData) {
        continue;
      }

      const homeTeamName = `${homeTeamData.City} ${homeTeamData.Name}`.toLowerCase();
      const awayTeamName = `${awayTeamData.City} ${awayTeamData.Name}`.toLowerCase();

      const homeFirestoreTeam = this.allFirestoreTeams.find((tm: NBATeam) => 
        tm.team.toLowerCase().includes(homeTeamName)
      );
      
      const awayFirestoreTeam = this.allFirestoreTeams.find((tm: NBATeam) => 
        tm.team.toLowerCase().includes(awayTeamName)
      );

      if (!homeFirestoreTeam || !awayFirestoreTeam) {
        continue;
      }

      const homeScore = game.HomeTeamScore ?? 0;
      const awayScore = game.AwayTeamScore ?? 0;
      const totalPoints = homeScore + awayScore;
      const gameTime = new Date(game.DateTime).toLocaleTimeString();

      const matchup: Matchup = {
        leftTeam: `${homeFirestoreTeam.team}`,
        leftRecord: `${homeFirestoreTeam.wins || 0}-${homeFirestoreTeam.losses || 0}`,
        leftScore: homeScore,
        leftSpread: "",
        rightSpread: "",
        totalPoints: totalPoints,
        rightScore: awayScore,
        rightRecord: `${awayFirestoreTeam.wins || 0}-${awayFirestoreTeam.losses || 0}`,
        rightTeam: `${awayFirestoreTeam.team}`,
        confidence: "Final",
        gameTime: gameTime,
        remove: "",
        leftWikipediaLogoUrl: homeTeamData.WikipediaLogoUrl,
        rightWikipediaLogoUrl: awayTeamData.WikipediaLogoUrl,
        isFinished: true
      };

      // Calculate spreads for finished games
      const spreads = this.utilsService.calculateSpreads(homeScore, awayScore, "");
      matchup.leftSpread = spreads.leftSpread;
      matchup.rightSpread = spreads.rightSpread;

      this.finishedMatchups.push(matchup);
    }
  }

  addMatchup(gameTime: string) {
    if (!this.selectedLeftTeam || !this.selectedRightTeam) {
      return;
    }

    const matchup: Matchup = {
      "leftTeam": this.selectedLeftTeam.team,
      "leftRecord": `${this.selectedLeftTeam.wins || 0}-${this.selectedLeftTeam.losses || 0}`,
      "leftScore": this.leftScore || 0,
      "leftSpread": "",
      "rightSpread": "",
      "totalPoints": this.totalPoints || 0,
      "rightScore": this.rightScore || 0,
      "rightRecord": `${this.selectedRightTeam.wins || 0}-${this.selectedRightTeam.losses || 0}`,
      "rightTeam": this.selectedRightTeam.team,
      "confidence": (this.confidenceScore || 0) + "%",
      "gameTime": gameTime || "User Generated",
      "remove": "",
      "leftWikipediaLogoUrl": this.selectedLeftTeam.WikipediaLogoUrl,
      "rightWikipediaLogoUrl": this.selectedRightTeam.WikipediaLogoUrl
    };

    // Calculate spreads using utility service
    const spreads = this.utilsService.calculateSpreads(matchup.leftScore, matchup.rightScore, this.spread || "");
    matchup.leftSpread = spreads.leftSpread;
    matchup.rightSpread = spreads.rightSpread;

    this.matchups.push(matchup);
  }

  calculateOdds() {
    if (!this.selectedLeftTeam || !this.selectedRightTeam || !this.avgPos || !this.avgOff) {
      return;
    }

    const result = this.oddsService.calculateNBAOdds(
      this.selectedLeftTeam,
      this.selectedRightTeam,
      this.avgPos,
      this.avgOff,
      this.leftHome || false,
      this.rightHome || false,
      this.neutral
    );

    if (result) {
      this.leftScore = result.leftScore;
      this.rightScore = result.rightScore;
      this.leftWinChance = result.leftWinChance;
      this.rightWinChance = result.rightWinChance;
      this.spread = result.spread;
      this.confidenceScore = result.confidenceScore;
      this.overUnder = result.overUnder;
      this.totalPoints = result.totalPoints;
      this.leftWinner = result.leftWinner;
      this.rightWinner = result.rightWinner;
      this.winner = result.leftWinner ? this.selectedLeftTeam : this.selectedRightTeam;
    }
  }

  getConfidenceClass(confidence: string): string {
    return this.utilsService.getConfidenceClass(confidence);
  }
}
