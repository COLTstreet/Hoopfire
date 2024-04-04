import { Component } from '@angular/core';
import { DataService } from '../../services/data.service';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular'; // AG Grid Component
import { ButtonModule } from 'primeng/button';

declare var stringSimilarity: any

@Component({
  selector: 'app-nba',
  standalone: true,
  imports: [DropdownModule, FormsModule, CommonModule, AgGridAngular, ButtonModule],
  templateUrl: './nba.component.html',
  styleUrl: './nba.component.scss'
})
export class NbaComponent {

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

  allTeams: any = []
  allTeams_BDL: any = []
  todaysGames: any = []

  matchups: any[] = [];

  gridApi: any;
  gridColumnApi: any;

  public rowSelection: any;
  public columnDefs = [
    {headerName: 'Team', field: 'leftTeam', checkboxSelection: true },
    {headerName: 'Score', field: 'leftScore' },
    {headerName: 'Spread', field: 'spread'},
    {headerName: 'Total Points', field: 'totalPoints'},
    {headerName: 'Score', field: 'rightScore'},
    {headerName: 'Team', field: 'rightTeam'},
    {headerName: 'Confidence %', field: 'confidence'},
    {headerName: 'Game Time', field: 'gameTime', valueFormatter: dateFormatter }
  ];

  public defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    wrapText: true,
    cellStyle: {fontSize: '11px'}
  };

  constructor(public _dataService: DataService) {

    this.neutral = true

    this.getNBAData()
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  }
  
  onBtnExport() {
    this.gridApi.exportDataAsCsv();
  }

  getNBAData() {
    this._dataService.getNBAAnalytics().subscribe((response: any) => {
      this.allFirestoreTeams = response

      this.calculateNBAAverages()
    })

    this._dataService.getNBATeams_BDL().subscribe((response: any) => {
      this.allTeams_BDL = response.data;
    })

    this._dataService.getNBATeams().subscribe((response: any) => {
      this.allTeams = response.sort((a: any, b: any) => a.Name.localeCompare(b.Name))
    })

    this._dataService.getTodaysNBASchedule().subscribe((response: any) => {
      this.todaysGames = response;
    })
  }

  calculateNBAAverages() {
    let ele = this.allFirestoreTeams.filter((d: any) => d.team === "League Average")[0];
    this.avgPos = ele.pace;
    this.avgOff = ele.oRtg;
  }

  calculateTodaysGames() {
    this.gridApi.setGridOption("rowData", []);
    let leftTeam: any;
    let rightTeam: any;
    let gameTime: any;
    let todaysMatchups = [];
    for (const key in this.todaysGames) {
      let ele = this.todaysGames[key];
      leftTeam = this.allTeams.filter((team: any) => team.Key.toLowerCase().includes(ele.HomeTeam.toLowerCase()))[0]
      rightTeam = this.allTeams.filter((team: any) => team.Key.toLowerCase().includes(ele.AwayTeam.toLowerCase()))[0]
      leftTeam = this.allFirestoreTeams.filter((tm: any) => tm.team.toLowerCase().includes((leftTeam.City + ' ' + leftTeam.Name).toLowerCase()))[0]
      rightTeam = this.allFirestoreTeams.filter((tm: any) => tm.team.toLowerCase().includes((rightTeam.City + ' ' + rightTeam.Name).toLowerCase()))[0]
      gameTime = ele.DateTime;
      todaysMatchups.push([leftTeam, rightTeam, gameTime])
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
      "spread": this.winner.team + " " + this.spread,
      "totalPoints": this.totalPoints,
      "rightScore": this.rightScore,
      "rightTeam": this.selectedRightTeam.team,
      "confidence": this.confidenceScore + "%",
      "gameTime": "User Generated",
      "remove": ""
    };

    if(gameTime) {
      matchup.gameTime = gameTime;
    }
    this.matchups.push(matchup)
    this.gridApi.setGridOption("rowData", this.matchups);
  }

  setSelectedLeftTeam() {
    for (const ele of this.allTeams) {
      if(stringSimilarity.compareTwoStrings((ele.City + " " + ele.Name), this.selectedLeftTeam.team) > .8) {
        this.selectedLeftTeam = {...this.selectedLeftTeam, ...ele};
      }
    }
    for (const ele of this.allTeams_BDL) {
      if(this.selectedLeftTeam.Key === ele.abbreviation) {
        this.selectedLeftTeam = {...this.selectedLeftTeam, ...ele};
      }
    }

    this._dataService.getNBATeamStats(this.selectedLeftTeam.id).subscribe((response: any) => {
      console.log(response.data)
    })

    // this._dataService.getNBATeamStats().subscribe((response: any) => {
    //   this.allTeams_BDL = response;
    // })

    console.log(this.selectedLeftTeam)
  }

  setSelectedRightTeam() {
    for (const ele of this.allTeams) {
      if(stringSimilarity.compareTwoStrings((ele.City + " " + ele.Name), this.selectedRightTeam.team) > .8) {
        this.selectedRightTeam = {...this.selectedRightTeam, ...ele};
      }
    }

    console.log(this.selectedRightTeam)
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

      var adjHomeOff = Number(leftTeam.oRtg) + Number(leftTeam.oRtg) * adv;
      var adjHomeDef = Number(leftTeam.dRtg) - Number(leftTeam.dRtg) * adv;

      var adjAwayOff = Number(rightTeam.oRtg) - Number(rightTeam.oRtg) * adv;
      var adjAwayDef = Number(rightTeam.dRtg) + Number(rightTeam.dRtg) * adv;

      let pythExp = 10.25;
      let adjHomePyth = Math.pow(adjHomeOff, pythExp) / (Math.pow(adjHomeOff, pythExp) + Math.pow(adjHomeDef, pythExp));
      let adjAwayPyth = Math.pow(adjAwayOff, pythExp) / (Math.pow(adjAwayOff, pythExp) + Math.pow(adjAwayDef, pythExp));

      let leftWinChance = (adjHomePyth - adjHomePyth * adjAwayPyth) / (adjHomePyth + adjAwayPyth - 2 * adjHomePyth * adjAwayPyth);
      this.leftWinChance = leftWinChance * 100;
      this.rightWinChance = (1 - leftWinChance) * 100;
      this.leftWinChance = this.leftWinChance.toFixed(0);
      this.rightWinChance = this.rightWinChance.toFixed(0);

      var adjPos = ((rightTeam.pace / this.avgPos) * (leftTeam.pace / this.avgPos)) * this.avgPos;

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

function dateFormatter(params: any) {
  if(params.data.gameTime === "User Generated") return "User Generated"
  var dateAsString = params.data.gameTime;
  return `${new Date(params.data.gameTime).toDateString()} ${new Date(params.data.gameTime).toLocaleTimeString()}`;
}
