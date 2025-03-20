import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Card } from 'primeng/card';
import { Chip } from 'primeng/chip';
import { combineLatest } from 'rxjs';

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
    
    this.conferenceMap.set("American Athletic", "Amer" )
    this.conferenceMap.set("Atlantic Coast", "ACC" )
    this.conferenceMap.set("Big Ten", "B10" )
    this.conferenceMap.set("Big 12", "B12" )
    this.conferenceMap.set("Conference USA", "CUSA" )
    this.conferenceMap.set("Mid-American", "MAC" )
    this.conferenceMap.set("Mountain West", "MWC" )
    this.conferenceMap.set("Pac-12", "WCC" )
    this.conferenceMap.set("Southeastern", "SEC" )
    this.conferenceMap.set("Sun Belt", "SB" )
    this.conferenceMap.set("America East",	"AE" )
    this.conferenceMap.set("Atlantic Sun",	"ASUN" )
    this.conferenceMap.set("Atlantic 10",	"A-10" )
    this.conferenceMap.set("Big East",	"BE" )
    this.conferenceMap.set("Big West", "BW" )
    this.conferenceMap.set("Coastal Athletic Association",	"CAA" )
    this.conferenceMap.set("Horizon League",	"Horz" )
    this.conferenceMap.set("Metro Atlantic Athletic",	"MAAC" )
    this.conferenceMap.set("Missouri Valley",	"MVC" )
    this.conferenceMap.set("Mountain Pacific Sports Federation",	"MPSF" )
    this.conferenceMap.set("Summit",	"Sum" )
    this.conferenceMap.set("West Coast", "WCC" )
    this.conferenceMap.set("Western Athletic", "WAC" )
    this.conferenceMap.set("Southwestern Athletic", "SWAC" )
    this.conferenceMap.set("Patriot League", "PL" )
    this.conferenceMap.set("Southland", "Slnd" )
    this.conferenceMap.set("Mid-Eastern", "MEAC" )
    this.conferenceMap.set("Northeast", "NEC" )
    this.conferenceMap.set("Ohio Valley", "OVC" )
    this.conferenceMap.set("Southern", "SC" )
    this.conferenceMap.set("Big Sky", "BSky" )
    this.conferenceMap.set("Big South", "BSth" )

    this.getNCAAData()
  }

  ngOnInit() {
  }

  getNCAAData() {

    combineLatest([
      this._dataService.getNCAAMAnalytics(),
      this._dataService.getAllNCAAMTeamSeasonStats(),
      this._dataService.getNCAAMTeams(),
      this._dataService.getTodaysNCAAMSchedule(),
    ]).subscribe(([firestoreData, ncaaTeamStatsData, ncaaTeamsData, scheduleData]: any) => {
      this.allFirestoreTeams = firestoreData
      this.allTeamSeasonStats = ncaaTeamStatsData;
      this.allTeams = ncaaTeamsData.sort((a: any, b: any) => a.School.localeCompare(b.School))
      this.todaysGames = scheduleData;

      this.calculateAverages()
      this.calculateTodaysGames()

    });
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

      // console.log(key)
      // if(key === "86") {
      //   console.log(key)
      // }

      let homeTeam = this.setSelectedTeam(ele.GlobalHomeTeamID)
      let awayTeam = this.setSelectedTeam(ele.GlobalAwayTeamID)

      // if(homeTeam.School === "Stanford" || awayTeam.School === "Stanford") {
      //   console.log("here")
      // }

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
      "leftRecord": this.selectedLeftTeam.winLoss,
      "leftScore": this.leftScore,
      "leftSpread": "",
      "rightSpread": "",
      "totalPoints": this.totalPoints,
      "rightScore": this.rightScore,
      "rightRecord": this.selectedRightTeam.winLoss,
      "rightTeam": this.selectedRightTeam.team,
      "confidence": this.confidenceScore + "%",
      "location": this.selectedLeftTeam.homeTeam ? this.selectedLeftTeam.Stadium : this.selectedRightTeam.Stadium,
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
  }

  setSelectedTeam(id: any) {
    let team: any;
    let temp1 = this.allTeams.filter((team: any) => team.GlobalTeamID === id)[0]
    let temp2: any
    if(temp1) {
      temp2 = this.allFirestoreTeams.filter((tm: any) => tm.team.toLowerCase().includes(temp1.School.toLowerCase()))
      
      if(temp1.School.includes("Michigan")) {
        console.log("here")
      }
      if(temp2 && temp2.length === 1) {
        team = {
          ...temp1,
          ...temp2[0]
        }
      } else if(temp2 && temp2.length > 1) {
        let temp3 = temp2.filter((tm: any) => tm.conference === this.conferenceMap.get(temp1.Conference) && tm.winLoss.split("-")[0] == temp1.Wins)[0]
        team = {
          ...temp1,
          ...temp3
        }
      } else {
        let schoolName = temp1.School.replace("College", '').trim()
        schoolName = schoolName.replace("University", '').trim()
        let schoolRecord = `${temp1.Wins}-${temp1.Losses}`
        this.allFirestoreTeams.filter((tm: any) => {
          if(stringSimilarity.compareTwoStrings(schoolName, tm.team) > .70 && this.conferenceMap.get(temp1.Conference).toLowerCase() === tm.conference.toLowerCase()) {
            temp2 = tm
          } else if (
            stringSimilarity.compareTwoStrings(schoolName, tm.team) > 0.35 &&
            this.conferenceMap.get(temp1.Conference).toLowerCase() === tm.conference.toLowerCase() &&
            schoolRecord === tm.winLoss
          ) {
            temp2 = tm;
          } else if(schoolName === "UIC") {
            temp2 = this.allFirestoreTeams.filter((t: any) => t.team.includes("Illinois Chicago"))[0]
          } else if(schoolName === "UAPB") {
            temp2 = this.allFirestoreTeams.filter((t: any) => t.team.includes("Arkansas Pine Bluff"))[0]
          }
        })
        team = {
          ...temp1,
          ...temp2
        }
        if(team.School.includes("Michigan")) {
          console.log("here")
        }
      }
    }
    team.homeTeam = true
    return team
  }

  calculateOdds() {
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
