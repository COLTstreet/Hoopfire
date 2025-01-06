import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Card } from 'primeng/card';
import { Chip } from 'primeng/chip';

declare var stringSimilarity: any

@Component({
  selector: 'app-ncaa',
  standalone: true,
  imports: [FormsModule, CommonModule, Card, Chip],
  templateUrl: './ncaa.component.html',
  styleUrl: './ncaa.component.scss',
  providers: [ConfirmationService, MessageService]
})
export class NCAAComponent implements OnInit {

  allFirestoreTeams: any = []
  leftTeamsList: any = []
  rightTeamsList: any = []

  avgPos: any | undefined
  avgOff: any | undefined

  leftHome: any | undefined
  rightHome: any | undefined
  neutral: any | undefined

  leftScore: any | undefined
  leftWinChance: any | undefined
  leftWinner: any | undefined

  rightScore: any | undefined
  rightWinChance: any | undefined
  rightWinner: any | undefined

  spread: any | undefined
  winner: any | undefined
  confidenceScore: any | undefined
  overUnder: any | undefined
  totalPoints: any | undefined

  selectedLeftTeam: any | undefined;
  selectedRightTeam: any | undefined;

  allTeamSeasonStats: any = []
  allTeams: any = []
  todaysGames: any = []

  matchups: any[] = [];

  gridApi: any;
  gridColumnApi: any;

  conferenceMap = new Map()

  constructor(public _dataService: DataService, private confirmationService: ConfirmationService, private messageService: MessageService) {

    this.neutral = true
    
    this.conferenceMap.set("American Athletic", "The American" )
    this.conferenceMap.set("Atlantic Coast", "ACC" )
    this.conferenceMap.set("Big Ten", "B10" )
    this.conferenceMap.set("Big 12", "Big 12" )
    this.conferenceMap.set("Conference USA", "CUSA" )
    this.conferenceMap.set("Mid-American", "MAC" )
    this.conferenceMap.set("Mountain West", "MWC" )
    this.conferenceMap.set("Pac-12", "Pac-12" )
    this.conferenceMap.set("Southeastern", "SEC" )
    this.conferenceMap.set("Sun Belt", "SB" )
    this.conferenceMap.set("America East",	"America East AmEast" )
    this.conferenceMap.set("Atlantic Sun",	"ASUN" )
    this.conferenceMap.set("Atlantic 10",	"A-10" )
    this.conferenceMap.set("Big East",	"BE" )
    this.conferenceMap.set("Big West", "BWC" )
    this.conferenceMap.set("Coastal Athletic Association",	"CAA" )
    this.conferenceMap.set("Horizon League",	"Horizon" )
    this.conferenceMap.set("Metro Atlantic Athletic",	"MAAC" )
    this.conferenceMap.set("Missouri Valley",	"MVC" )
    this.conferenceMap.set("Mountain Pacific Sports Federation",	"MPSF" )
    this.conferenceMap.set("Summit League",	"The Summit" )
    this.conferenceMap.set("West Coast", "WCC" )
    this.conferenceMap.set("Western Athletic", "WAC" )
    this.conferenceMap.set("Southwestern Athletic", "SWAC" )
    this.conferenceMap.set("Patriot League", "Pat" )

    this.getNCAAData()
  }

  ngOnInit() {
  }

  getNCAAData() {
    this._dataService.getNCAAMAnalytics().subscribe((response: any) => {
      this.allFirestoreTeams = response

      this._dataService.getAllNCAAMTeamSeasonStats().subscribe((response2: any) => {
        this.allTeamSeasonStats = response2;


        this._dataService.getNCAAMTeams().subscribe((response3: any) => {
          this.allTeams = response3.sort((a: any, b: any) => a.School.localeCompare(b.School))
          
          this._dataService.getTodaysNCAAMSchedule().subscribe((response4: any) => {
            this.todaysGames = response4;

            this.calculateAverages()
            this.calculateTodaysGames()
          })
        })
      })
    })
  }

  calculateAverages() {
    let avgPosSum = 0;
    let avgOffSum = 0;
    for (const key in this.allFirestoreTeams) {
      let ele = this.allFirestoreTeams[key];
      if (ele.team != "Team") {
        avgPosSum += Number(ele.adjT);
        avgOffSum += Number(ele.adjO);
      }
    }

    this.avgPos = avgPosSum / this.allFirestoreTeams.length;
    this.avgOff = avgOffSum / this.allFirestoreTeams.length;
  }

  calculateTodaysGames() {
    // this.gridApi.setRowData([]);
    let homeTeam: any;
    let awayTeam: any;
    let gameTime: any;
    let todaysMatchups = [];
    for (const key in this.todaysGames) {
      let ele = this.todaysGames[key];


      let temp1 = this.allTeams.filter((team: any) => team.Key.toLowerCase().includes(ele.HomeTeam.toLowerCase()))[0]
      if(temp1) {
        homeTeam = {
          ...temp1,
          ...this.allFirestoreTeams.filter((tm: any) => tm.team.toLowerCase().includes(temp1.School.split(" ")[0].toLowerCase()))[0]
        }
      }

      let temp2 = this.allTeams.filter((team: any) => team.Key.toLowerCase().includes(ele.AwayTeam.toLowerCase()))[0]
      if(temp2) {
        awayTeam = {
          ...temp2,
          ...this.allFirestoreTeams.filter((tm: any) => tm.team.toLowerCase().includes(temp2.School.split(" ")[0].toLowerCase()))[0]
        }
      }

      if(homeTeam && awayTeam) {
        gameTime = new Date(ele.DateTime).toLocaleTimeString();
        todaysMatchups.push([homeTeam, awayTeam, gameTime])
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
    
    this.leftWinner = false;
    this.rightWinner = false;
    this.spread = '';
    this.confidenceScore = '';
  }

  addMatchup(gameTime: any) {
    if(!this.selectedLeftTeam || !this.selectedRightTeam)  return
    var matchup = {
      "leftTeam": this.selectedLeftTeam.team,
      "leftScore": this.leftScore,
      "leftSpread": "",
      "rightSpread": "",
      "totalPoints": this.totalPoints,
      "rightScore": this.rightScore,
      "rightTeam": this.selectedRightTeam.team,
      "confidence": this.confidenceScore + "%",
      "gameTime": "User Generated",
      "remove": "",
      "leftTeamLogoUrl": this.selectedLeftTeam.TeamLogoUrl,
      "rightTeamLogoUrl": this.selectedRightTeam.TeamLogoUrl
    };
    if(matchup.leftScore > matchup.rightScore) {
      matchup.leftSpread = this.spread,
      matchup.rightSpread = this.spread.replace("-","+")
    } else {
      matchup.rightSpread = this.spread,
      matchup.leftSpread = this.spread.replace("-","+")
    }

    if(gameTime) {
      matchup.gameTime = gameTime;
    }
    this.matchups.push(matchup)
    // this.gridApi.setGridOption("rowData", this.matchups);
  }

  setSelectedLeftTeam() {
    for (const ele of this.allTeams) {
      if(this.selectedLeftTeam.team && stringSimilarity.compareTwoStrings(ele.School, this.selectedLeftTeam.team) > .8) {
        if(this.conferenceMap.get(ele.Conference) === this.selectedLeftTeam.conference) {
          this.selectedLeftTeam = {...this.selectedLeftTeam, ...ele};
        }
      }
    }
    for (const ele of this.allTeamSeasonStats) {
      if(ele.GlobalTeamID === this.selectedLeftTeam.GlobalTeamID) {
          this.selectedLeftTeam = {...this.selectedLeftTeam, ...ele};
      }
    }
  }

  setSelectedRightTeam() {
    for (const ele of this.allTeams) {
      if(this.selectedRightTeam.team && stringSimilarity.compareTwoStrings(ele.School, this.selectedRightTeam.team) > .8) {
        if(this.conferenceMap.get(ele.Conference) === this.selectedRightTeam.conference) {
          this.selectedRightTeam = {...this.selectedRightTeam, ...ele};
        }
      }
    }
    for (const ele of this.allTeamSeasonStats) {
      if(ele.GlobalTeamID === this.selectedRightTeam.GlobalTeamID) {
          this.selectedRightTeam = {...this.selectedRightTeam, ...ele};
      }
    }
  }

  calculateOdds() {
    if(this.selectedLeftTeam) this.setSelectedLeftTeam()
    if(this.selectedRightTeam) this.setSelectedRightTeam()
    if (this.selectedLeftTeam && this.selectedRightTeam) {
      let rightTeam: any, leftTeam: any
      let adv = .010;
      if (this.leftHome || this.neutral) {
        leftTeam = this.selectedLeftTeam;
        rightTeam = this.selectedRightTeam;
      } else if (this.rightHome) {
        leftTeam = this.selectedRightTeam;
        rightTeam = this.selectedLeftTeam;
      }

      let adjHomeOff = Number(leftTeam.adjO)
      let adjHomeDef = Number(leftTeam.adjD)

      let adjAwayOff = Number(rightTeam.adjO)
      let adjAwayDef = Number(rightTeam.adjD)

      let pythExp = 10.25;
      let adjHomePyth = Math.pow(adjHomeOff, pythExp) / (Math.pow(adjHomeOff, pythExp) + Math.pow(adjHomeDef, pythExp));
      let adjAwayPyth = Math.pow(adjAwayOff, pythExp) / (Math.pow(adjAwayOff, pythExp) + Math.pow(adjAwayDef, pythExp));

      let leftWinChance = (adjHomePyth - adjHomePyth * adjAwayPyth) / (adjHomePyth + adjAwayPyth - 2 * adjHomePyth * adjAwayPyth);
      this.leftWinChance = leftWinChance * 100;
      this.rightWinChance = (1 - leftWinChance) * 100;
      this.leftWinChance = this.leftWinChance.toFixed(0);
      this.rightWinChance = this.rightWinChance.toFixed(0);

      let adjPos = ((rightTeam.adjT / this.avgPos) * (leftTeam.adjT / this.avgPos)) * this.avgPos;

      let rightScoreDecimal = (((adjAwayOff / this.avgOff) * (adjHomeDef / this.avgOff)) * (this.avgOff) * (adjPos / 100));
      this.rightScore = Number(rightScoreDecimal.toFixed(0));
      let leftScoreDecimal = (((adjHomeOff / this.avgOff) * (adjAwayDef / this.avgOff)) * (this.avgOff) * (adjPos / 100));

      if(!this.neutral) {	
        leftScoreDecimal = leftScoreDecimal + 3.2;	
      }
      
      this.leftScore = Number(leftScoreDecimal.toFixed(0));

      let decSpread = Math.abs(leftScoreDecimal - (rightScoreDecimal));

      if (leftScoreDecimal > rightScoreDecimal) {
        this.spread = "-" + (Math.round(decSpread * 2) / 2).toFixed(1);
        this.winner = leftTeam;
        this.confidenceScore = this.leftWinChance;
      } else {
        this.spread = "-" + (Math.round(decSpread * 2) / 2).toFixed(1);
        this.winner = rightTeam;
        this.confidenceScore = this.rightWinChance;
      }

      if (this.leftHome || this.neutral) {
        this.leftScore = this.leftScore;
        this.rightScore = this.rightScore;
        if (leftScoreDecimal > rightScoreDecimal) {
          this.leftWinner = true;
          this.rightWinner = false;
        } else {
          this.leftWinner = false;
          this.rightWinner = true;
        }
      } else if (this.rightHome) {
        this.leftScore = this.rightScore;
        this.rightScore = this.leftScore;
        if (leftScoreDecimal > rightScoreDecimal) {
          this.leftWinner = false;
          this.rightWinner = true;
        } else {
          this.leftWinner = true;
          this.rightWinner = false;
        }
      }


      this.overUnder = (rightScoreDecimal + leftScoreDecimal).toFixed(2);
      this.totalPoints = this.leftScore + this.rightScore;
    }
  }
}
