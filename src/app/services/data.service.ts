import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Injector, WritableSignal, inject, signal } from '@angular/core';
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import { Observable, catchError, throwError } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private _http: HttpClient;
  firestore: Firestore = inject(Firestore);

  // API Key should be moved to environment variables
  private readonly SPORTSDATA_API_KEY = "0454641805084287b986922e21b0b81f";
  private readonly SPORTSDATA_BASE_URL = "https://api.sportsdata.io/v3";

  isNCAAActive: WritableSignal<boolean> = signal(true);
  isNCAAActive$ = toObservable(this.isNCAAActive);

  constructor(public injector: Injector) { 
    this._http = injector.get(HttpClient);
  }

  getNBAAnalytics(): Observable<any> {
    const itemCollection = collection(this.firestore, 'nba-teams');
    return collectionData(itemCollection).pipe(
      catchError(error => {
        console.error('Error fetching NBA analytics:', error);
        return throwError(() => error);
      })
    );
  }

  getNBATeams(): Observable<any> {
    return this.getWithKey(`${this.SPORTSDATA_BASE_URL}/nba/scores/json/teams`);
  }

  getTodaysNBASchedule(): Observable<any> {
    const date = this.formatDateForAPI(new Date());
    return this.getWithKey(`${this.SPORTSDATA_BASE_URL}/nba/scores/json/GamesByDate/${date}`);
  }

  getAllNBAInjuries(): Observable<any> {
    return this.getWithKey(`${this.SPORTSDATA_BASE_URL}/nba/projections/json/InjuredPlayers`);
  }

  getNCAAMAnalytics(): Observable<any> {
    const itemCollection = collection(this.firestore, 'college-teams');
    return collectionData(itemCollection).pipe(
      catchError(error => {
        console.error('Error fetching NCAA analytics:', error);
        return throwError(() => error);
      })
    );
  }

  getNCAAMTeams(): Observable<any> {
    return this.getWithKey(`${this.SPORTSDATA_BASE_URL}/cbb/scores/json/teams`);
  }

  getTodaysNCAAMSchedule(): Observable<any> {
    const date = this.formatDateForAPI(new Date());
    return this.getWithKey(`${this.SPORTSDATA_BASE_URL}/cbb/scores/json/GamesByDate/${date}`);
  }

  getAllNCAAMInjuries(): Observable<any> {
    return this.getWithKey(`${this.SPORTSDATA_BASE_URL}/cbb/scores/json/InjuredPlayers`);
  }

  getAllNCAAMTeamSeasonStats(year: number = new Date().getFullYear()): Observable<any> {
    return this.getWithKey(`${this.SPORTSDATA_BASE_URL}/cbb/scores/json/TeamSeasonStats/${year}`);
  }

  /**
   * Format date for SportsData API (YYYY-MMM-DD format)
   */
  private formatDateForAPI(date: Date): string {
    const dateParts = date.toDateString().split(' ');
    return `${dateParts[3]}-${dateParts[1].toUpperCase()}-${dateParts[2]}`;
  }

  /**
   * Make API request with API key
   */
  protected getWithKey(url: string): Observable<any> {
    return this._http.get(`${url}?key=${this.SPORTSDATA_API_KEY}`).pipe(
      catchError(error => {
        console.error(`Error fetching from ${url}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Make API request with Authorization header
   */
  protected getWithAuth(url: string, authKey: string): Observable<any> {
    const headers = new HttpHeaders().append("Authorization", authKey);
    return this._http.get(url, { headers }).pipe(
      catchError(error => {
        console.error(`Error fetching from ${url}:`, error);
        return throwError(() => error);
      })
    );
  }
}
