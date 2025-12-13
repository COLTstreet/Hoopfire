import { Component } from '@angular/core';
import { DataService } from '../../services/data.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Card } from 'primeng/card';
import { combineLatest } from 'rxjs';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { inject } from '@angular/core';

interface PredictionRecord {
  wins: number;
  losses: number;
}

@Component({
  selector: 'app-stats',
  imports: [Card],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',
  providers: [ConfirmationService, MessageService]
})
export class StatsComponent {
  firestore: Firestore = inject(Firestore);

  ncaaRecord: PredictionRecord | null = null;
  nbaRecord: PredictionRecord | null = null;

  constructor(
    public _dataService: DataService, 
    private confirmationService: ConfirmationService, 
    private messageService: MessageService
  ) {
    this.getStats();
  }

  getStats() {
    // Fetch NCAA record
    const ncaaRecordRef = doc(this.firestore, 'college-predictions-2026/record');
    docData(ncaaRecordRef).subscribe({
      next: (data: any) => {
        this.ncaaRecord = data || { wins: 0, losses: 0 };
      },
      error: (error: any) => {
        console.error('Error fetching NCAA record:', error);
        this.ncaaRecord = { wins: 0, losses: 0 };
      }
    });

    // Fetch NBA record
    const nbaRecordRef = doc(this.firestore, 'nba-predictions-2026/record');
    docData(nbaRecordRef).subscribe({
      next: (data: any) => {
        this.nbaRecord = data || { wins: 0, losses: 0 };
      },
      error: (error: any) => {
        console.error('Error fetching NBA record:', error);
        this.nbaRecord = { wins: 0, losses: 0 };
      }
    });
  }

  getWinPercentage(wins: number, losses: number): number {
    const total = wins + losses;
    if (total === 0) return 0;
    return Math.round((wins / total) * 100);
  }

  getTotalGames(wins: number, losses: number): number {
    return wins + losses;
  }

  getOverallWins(): number {
    if (!this.ncaaRecord || !this.nbaRecord) return 0;
    return this.ncaaRecord.wins + this.nbaRecord.wins;
  }

  getOverallLosses(): number {
    if (!this.ncaaRecord || !this.nbaRecord) return 0;
    return this.ncaaRecord.losses + this.nbaRecord.losses;
  }

  getOverallTotalGames(): number {
    return this.getOverallWins() + this.getOverallLosses();
  }

  getOverallWinPercentage(): number {
    const total = this.getOverallTotalGames();
    if (total === 0) return 0;
    return Math.round((this.getOverallWins() / total) * 100);
  }
}
