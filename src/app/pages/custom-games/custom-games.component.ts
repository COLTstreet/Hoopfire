import { Component } from '@angular/core';
import { DataService } from '../../services/data.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular'; // AG Grid Component
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { Card } from 'primeng/card';
import { Chip } from 'primeng/chip';
import { Select } from 'primeng/select';

import * as XLSX from 'xlsx';

declare var stringSimilarity: any

@Component({
    selector: 'app-custom-games',
    imports: [Select, FormsModule, CommonModule, AgGridAngular, Button, Tooltip, ConfirmDialog, Toast, Card, Chip],
    templateUrl: './custom-games.component.html',
    styleUrl: './custom-games.component.scss',
    providers: [ConfirmationService, MessageService]
})
export class CustomGamesComponent {

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
  loser: any | undefined
  confidenceScore: any | undefined
  overUnder: any | undefined
  totalPoints: any | undefined

  selectedLeftTeam: any | undefined;
  selectedRightTeam: any | undefined;

  allTeams: any = []
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

  constructor(public _dataService: DataService, private confirmationService: ConfirmationService, private messageService: MessageService) {

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

    this._dataService.getNBATeams().subscribe((response: any) => {
      this.allTeams = response.sort((a: any, b: any) => a.Name.localeCompare(b.Name))
    })
  }

  calculateNBAAverages() {
    let ele = this.allFirestoreTeams.filter((d: any) => d.team === "League Average")[0];
    this.avgPos = ele.pace;
    this.avgOff = ele.oRtg;
  }

  calculateTodaysGames() {
    // this.gridApi.setGridOption("rowData", []);
    this.matchups = []
    let leftTeam: any;
    let rightTeam: any;
    let gameTime: any;
    let todaysMatchups = [];
    for (const key in this.todaysGames) {
      let ele = this.todaysGames[key];

      let temp1 = this.allTeams.filter((team: any) => team.Key.toLowerCase().includes(ele.HomeTeam.toLowerCase()))[0]
      leftTeam = {
        ...temp1,
        ...this.allFirestoreTeams.filter((tm: any) => tm.team.toLowerCase().includes((temp1.City + ' ' + temp1.Name).toLowerCase()))[0]
      }

      let temp2 = this.allTeams.filter((team: any) => team.Key.toLowerCase().includes(ele.AwayTeam.toLowerCase()))[0]
      rightTeam = {
        ...temp2,
        ...this.allFirestoreTeams.filter((tm: any) => tm.team.toLowerCase().includes((temp2.City + ' ' + temp2.Name).toLowerCase()))[0]
      }

      gameTime = new Date(ele.DateTime).toLocaleTimeString()
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
    console.log(this.matchups)
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
      "leftWikipediaLogoUrl": this.selectedLeftTeam.WikipediaLogoUrl,
      "rightWikipediaLogoUrl": this.selectedRightTeam.WikipediaLogoUrl
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
      if(stringSimilarity.compareTwoStrings((ele.City + " " + ele.Name), this.selectedLeftTeam.team) > .8) {
        this.selectedLeftTeam = {...this.selectedLeftTeam, ...ele};
      }
    }

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

  clearLeftSide() {
    this.selectedLeftTeam = null;
    this.leftScore = null;
    this.leftTeamsList = null;
    this.leftWinChance = null;
    this.leftWinner = null;
  }

  clearRightSide() {
    this.selectedRightTeam = null;
    this.rightScore = null;
    this.rightTeamsList = null;
    this.rightWinChance = null;
    this.rightWinner = null;
  }

  clearAllGames() {
    this.matchups = []
  }

  confirmRemoveSingleGame(evt: any, idx: number) {
    this.confirmationService.confirm({
        target: evt.target as EventTarget,
        message: 'Are you sure that you want to proceed?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptIcon:"none",
        rejectIcon:"none",
        rejectButtonStyleClass:"p-button-text",
        accept: () => {
            this.messageService.add({ severity: 'info', summary: 'Confirmed', detail: 'You have deleted a game' });
            this.matchups.splice(idx, 1);
        },
        reject: () => {
            // this.messageService.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 });
        }
    });
  }

  calculateOdds() {
    this.selectedLeftTeam ? this.setSelectedLeftTeam() : this.clearLeftSide()
    this.selectedRightTeam ? this.setSelectedRightTeam() : this.clearRightSide()
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

      var adjAwayOff = Number(rightTeam.oRtg) + Number(rightTeam.oRtg) * adv;
      var adjAwayDef = Number(rightTeam.dRtg) - Number(rightTeam.dRtg) * adv;

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
        this.loser = rightTeam;
        this.confidenceScore = this.leftWinChance;
      } else {
        this.spread = "-" + (Math.round(decSpread * 2) / 2).toFixed(1);
        this.winner = rightTeam;
        this.loser = leftTeam;
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
  
  exportToExcel() {
    if(this.matchups.length > 0) {
      const columns = this.getColumns(this.matchups);
      const worksheet = XLSX.utils.json_to_sheet(this.matchups, { header: columns });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, 'games.xlsx');
    }
  }
  
  getColumns(data: any[]): string[] {
    const columns: any[] = [];
    data.forEach(row => {
      Object.keys(row).forEach(col => {
        if (!columns.includes(col)) {
          columns.push(col);
        }
      });
    });
    return columns;
  }

}

function dateFormatter(params: any) {
  if(params.data.gameTime === "User Generated") return "User Generated"
  var dateAsString = params.data.gameTime;
  return `${new Date(params.data.gameTime).toDateString()} ${new Date(params.data.gameTime).toLocaleTimeString()}`;
}
