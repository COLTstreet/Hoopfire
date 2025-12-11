import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  /**
   * Get confidence class based on percentage value
   */
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

  /**
   * Format date to locale time string
   */
  formatGameTime(dateTime: string | Date): string {
    if (typeof dateTime === 'string' && dateTime === "User Generated") {
      return "User Generated";
    }
    
    try {
      const date = new Date(dateTime);
      return date.toLocaleTimeString();
    } catch (error) {
      return String(dateTime);
    }
  }

  /**
   * Calculate spreads for a matchup
   */
  calculateSpreads(leftScore: number, rightScore: number, spread: string): { leftSpread: string; rightSpread: string } {
    if (leftScore > rightScore) {
      return {
        leftSpread: spread || "",
        rightSpread: (spread || "").replace("-", "+")
      };
    } else {
      return {
        rightSpread: spread || "",
        leftSpread: (spread || "").replace("-", "+")
      };
    }
  }
}

