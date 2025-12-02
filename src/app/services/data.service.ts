import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Injector, WritableSignal, inject, signal } from '@angular/core';
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private _http: HttpClient;
  firestore: Firestore = inject(Firestore);

  // isNCAAActive = true;
  isNCAAActive: WritableSignal<boolean> = signal(true)
  isNCAAActive$ = toObservable(this.isNCAAActive);

  constructor(public injector: Injector) { 
    this._http = injector.get(HttpClient);
  }

  getNBAAnalytics(): Observable<any> {
    const itemCollection = collection(this.firestore, 'nba-teams')
    return collectionData(itemCollection);
  }

  getNBATeams(): Observable<any> {
    return this.getWithKey("https://api.sportsdata.io/v3/nba/scores/json/teams", "0454641805084287b986922e21b0b81f");
  }

  getTodaysNBASchedule() {
    let today = new Date().toDateString().split(' ');
    let date = today[3] + '-' + today[1].toUpperCase() + '-' + today[2]
    return this.getWithKey("https://api.sportsdata.io/v3/nba/scores/json/GamesByDate/" + date, "0454641805084287b986922e21b0b81f");
  }

  getAllNBAInjuries() {
    return this.getWithKey("https://api.sportsdata.io/v3/nba/projections/json/InjuredPlayers", "0454641805084287b986922e21b0b81f");
  }

  getNCAAMAnalytics(): Observable<any> {
    const itemCollection = collection(this.firestore, 'college-teams')
    return collectionData(itemCollection);
  }

  getNCAAMTeams(): Observable<any> {
    return this.getWithKey("https://api.sportsdata.io/v3/cbb/scores/json/teams", "0454641805084287b986922e21b0b81f");
  }

  getTodaysNCAAMSchedule() {
    let today = new Date().toDateString().split(' ');
    let date = today[3] + '-' + today[1].toUpperCase() + '-' + today[2]
    return this.getWithKey("https://api.sportsdata.io/v3/cbb/scores/json/GamesByDate/" + date, "0454641805084287b986922e21b0b81f");
  }

  getAllNCAAMInjuries() {
    return this.getWithKey("https://api.sportsdata.io/v3/cbb/scores/json/InjuredPlayers", "0454641805084287b986922e21b0b81f");
  }

  getAllNCAAMTeamSeasonStats() {
    let year = 2024
    return this.getWithKey("https://api.sportsdata.io/v3/cbb/scores/json/TeamSeasonStats/" + year, "0454641805084287b986922e21b0b81f");
  }
  



  protected getWithKey(cmd: string, key: any) {
    // let headers = new HttpHeaders();
    // headers = headers.append("x-rapidapi-key", "e2f8226b79af2bdcd066e64fda2999ef");
    // headers = headers.append("x-rapidapi-host", "v1.basketball.api-sports.io");
    // headers = headers.append("Ocp-Apim-Subscription-Key", key);
    // headers = headers.append("Authorization", key);
    
    //console.log(cmd)
    // return this._http.get(cmd, {headers});
    return this._http.get(cmd + "?key=" + key);
  }

  protected getwithAuth(cmd: string, key: any) {
    let headers = new HttpHeaders();
    headers = headers.append("Authorization", key);
    
    //console.log(cmd)
    return this._http.get(cmd, { headers });
  }
}
