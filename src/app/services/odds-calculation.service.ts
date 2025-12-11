import { Injectable } from '@angular/core';
import { NBATeam, NCAATeam } from '../models/team.model';

export interface OddsCalculationResult {
  leftScore: number;
  rightScore: number;
  leftWinChance: number;
  rightWinChance: number;
  spread: string;
  confidenceScore: number;
  overUnder: number;
  totalPoints: number;
  leftWinner: boolean;
  rightWinner: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OddsCalculationService {
  // Constants
  private readonly HOME_ADVANTAGE = 0.010;
  private readonly PYTHAGOREAN_EXPONENT = 10.25;
  private readonly HOME_SCORE_ADJUSTMENT = 3.2;

  /**
   * Calculate odds for NBA teams
   */
  calculateNBAOdds(
    leftTeam: NBATeam,
    rightTeam: NBATeam,
    avgPos: number,
    avgOff: number,
    leftHome: boolean = false,
    rightHome: boolean = false,
    neutral: boolean = true
  ): OddsCalculationResult | null {
    if (!leftTeam || !rightTeam || !avgPos || !avgOff) {
      return null;
    }

    // Validate required stats
    if (!leftTeam.oRtg || !leftTeam.dRtg || !rightTeam.oRtg || !rightTeam.dRtg) {
      console.warn('Missing required team statistics');
      return null;
    }

    let homeTeam: NBATeam, awayTeam: NBATeam;
    
    // Determine home/away teams
    if (leftHome || neutral) {
      homeTeam = leftTeam;
      awayTeam = rightTeam;
    } else if (rightHome) {
      homeTeam = rightTeam;
      awayTeam = leftTeam;
    } else {
      homeTeam = leftTeam;
      awayTeam = rightTeam;
    }

    const adv = this.HOME_ADVANTAGE;
    const adjHomeOff = Number(homeTeam.oRtg) + Number(homeTeam.oRtg) * adv;
    const adjHomeDef = Number(homeTeam.dRtg) - Number(homeTeam.dRtg) * adv;
    const adjAwayOff = Number(awayTeam.oRtg) + Number(awayTeam.oRtg) * adv;
    const adjAwayDef = Number(awayTeam.dRtg) - Number(awayTeam.dRtg) * adv;

    // Calculate win probabilities
    const pythExp = this.PYTHAGOREAN_EXPONENT;
    const adjHomePyth = Math.pow(adjHomeOff, pythExp) / 
      (Math.pow(adjHomeOff, pythExp) + Math.pow(adjHomeDef, pythExp));
    const adjAwayPyth = Math.pow(adjAwayOff, pythExp) / 
      (Math.pow(adjAwayOff, pythExp) + Math.pow(adjAwayDef, pythExp));

    const homeWinChance = (adjHomePyth - adjHomePyth * adjAwayPyth) / 
      (adjHomePyth + adjAwayPyth - 2 * adjHomePyth * adjAwayPyth);
    
    const homeWinChancePercent = Number((homeWinChance * 100).toFixed(0));
    const awayWinChancePercent = Number(((1 - homeWinChance) * 100).toFixed(0));

    // Calculate scores
    const adjPos = ((awayTeam.pace || 0) / avgPos) * 
      ((homeTeam.pace || 0) / avgPos) * avgPos;

    let awayScoreDecimal = (((adjAwayOff / avgOff) * (adjHomeDef / avgOff)) * 
      avgOff * (adjPos / 100));
    
    let homeScoreDecimal = (((adjHomeOff / avgOff) * (adjAwayDef / avgOff)) * 
      avgOff * (adjPos / 100));

    if (!neutral) {
      homeScoreDecimal = homeScoreDecimal + this.HOME_SCORE_ADJUSTMENT;
    }

    // Calculate spread
    const decSpread = Math.abs(homeScoreDecimal - awayScoreDecimal);
    const spreadValue = (Math.round(decSpread * 2) / 2).toFixed(1);
    const spread = "-" + spreadValue;

    // Determine winner
    const homeWins = homeScoreDecimal > awayScoreDecimal;
    const confidenceScore = homeWins ? homeWinChancePercent : awayWinChancePercent;

    // Map back to left/right based on home/away assignment
    let leftScore: number, rightScore: number;
    let leftWinChance: number, rightWinChance: number;
    let leftWinner: boolean, rightWinner: boolean;

    if (leftHome || neutral) {
      leftScore = Number(homeScoreDecimal.toFixed(0));
      rightScore = Number(awayScoreDecimal.toFixed(0));
      leftWinChance = homeWinChancePercent;
      rightWinChance = awayWinChancePercent;
      leftWinner = homeWins;
      rightWinner = !homeWins;
    } else if (rightHome) {
      // Swap scores
      leftScore = Number(awayScoreDecimal.toFixed(0));
      rightScore = Number(homeScoreDecimal.toFixed(0));
      leftWinChance = awayWinChancePercent;
      rightWinChance = homeWinChancePercent;
      leftWinner = !homeWins;
      rightWinner = homeWins;
    } else {
      leftScore = Number(homeScoreDecimal.toFixed(0));
      rightScore = Number(awayScoreDecimal.toFixed(0));
      leftWinChance = homeWinChancePercent;
      rightWinChance = awayWinChancePercent;
      leftWinner = homeWins;
      rightWinner = !homeWins;
    }

    return {
      leftScore,
      rightScore,
      leftWinChance,
      rightWinChance,
      spread,
      confidenceScore,
      overUnder: Number((homeScoreDecimal + awayScoreDecimal).toFixed(2)),
      totalPoints: leftScore + rightScore,
      leftWinner,
      rightWinner
    };
  }

  /**
   * Calculate odds for NCAA teams
   */
  calculateNCAAOdds(
    leftTeam: NCAATeam,
    rightTeam: NCAATeam,
    avgPos: number,
    avgOff: number,
    leftHome: boolean = false,
    rightHome: boolean = false,
    neutral: boolean = true
  ): OddsCalculationResult | null {
    if (!leftTeam || !rightTeam || !avgPos || !avgOff) {
      return null;
    }

    // Validate required stats
    if (!leftTeam.adjO || !leftTeam.adjD || !rightTeam.adjO || !rightTeam.adjD) {
      console.warn('Missing required team statistics');
      return null;
    }

    let homeTeam: NCAATeam, awayTeam: NCAATeam;
    
    // Determine home/away teams
    if (leftHome || neutral) {
      homeTeam = leftTeam;
      awayTeam = rightTeam;
    } else if (rightHome) {
      homeTeam = rightTeam;
      awayTeam = leftTeam;
    } else {
      homeTeam = leftTeam;
      awayTeam = rightTeam;
    }

    const adjHomeOff = Number(homeTeam.adjO);
    const adjHomeDef = Number(homeTeam.adjD);
    const adjAwayOff = Number(awayTeam.adjO);
    const adjAwayDef = Number(awayTeam.adjD);

    // Calculate win probabilities
    const pythExp = this.PYTHAGOREAN_EXPONENT;
    const adjHomePyth = Math.pow(adjHomeOff, pythExp) / 
      (Math.pow(adjHomeOff, pythExp) + Math.pow(adjHomeDef, pythExp));
    const adjAwayPyth = Math.pow(adjAwayOff, pythExp) / 
      (Math.pow(adjAwayOff, pythExp) + Math.pow(adjAwayDef, pythExp));

    const homeWinChance = (adjHomePyth - adjHomePyth * adjAwayPyth) / 
      (adjHomePyth + adjAwayPyth - 2 * adjHomePyth * adjAwayPyth);
    
    const homeWinChancePercent = Number((homeWinChance * 100).toFixed(0));
    const awayWinChancePercent = Number(((1 - homeWinChance) * 100).toFixed(0));

    // Calculate scores
    const adjPos = ((awayTeam.adjT || 0) / avgPos) * 
      ((homeTeam.adjT || 0) / avgPos) * avgPos;

    let awayScoreDecimal = (((adjAwayOff / avgOff) * (adjHomeDef / avgOff)) * 
      avgOff * (adjPos / 100));
    
    let homeScoreDecimal = (((adjHomeOff / avgOff) * (adjAwayDef / avgOff)) * 
      avgOff * (adjPos / 100));

    if (!neutral) {
      homeScoreDecimal = homeScoreDecimal + this.HOME_SCORE_ADJUSTMENT;
    }

    // Calculate spread
    const decSpread = Math.abs(homeScoreDecimal - awayScoreDecimal);
    const spreadValue = (Math.round(decSpread * 2) / 2).toFixed(1);
    const spread = "-" + spreadValue;

    // Determine winner
    const homeWins = homeScoreDecimal > awayScoreDecimal;
    const confidenceScore = homeWins ? homeWinChancePercent : awayWinChancePercent;

    // Map back to left/right based on home/away assignment
    let leftScore: number, rightScore: number;
    let leftWinChance: number, rightWinChance: number;
    let leftWinner: boolean, rightWinner: boolean;

    if (leftHome || neutral) {
      leftScore = Number(homeScoreDecimal.toFixed(0));
      rightScore = Number(awayScoreDecimal.toFixed(0));
      leftWinChance = homeWinChancePercent;
      rightWinChance = awayWinChancePercent;
      leftWinner = homeWins;
      rightWinner = !homeWins;
    } else if (rightHome) {
      // Swap scores
      leftScore = Number(awayScoreDecimal.toFixed(0));
      rightScore = Number(homeScoreDecimal.toFixed(0));
      leftWinChance = awayWinChancePercent;
      rightWinChance = homeWinChancePercent;
      leftWinner = !homeWins;
      rightWinner = homeWins;
    } else {
      leftScore = Number(homeScoreDecimal.toFixed(0));
      rightScore = Number(awayScoreDecimal.toFixed(0));
      leftWinChance = homeWinChancePercent;
      rightWinChance = awayWinChancePercent;
      leftWinner = homeWins;
      rightWinner = !homeWins;
    }

    return {
      leftScore,
      rightScore,
      leftWinChance,
      rightWinChance,
      spread,
      confidenceScore,
      overUnder: Number((homeScoreDecimal + awayScoreDecimal).toFixed(2)),
      totalPoints: leftScore + rightScore,
      leftWinner,
      rightWinner
    };
  }
}

