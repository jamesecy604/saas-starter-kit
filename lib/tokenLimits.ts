export class TokenLimits {
  static checkUserDailyLimit(usage: number): boolean {
    return usage < parseInt(process.env.USER_DAILY_TOKEN_LIMIT || '1000000');
  }

  static checkUserMonthlyLimit(usage: number): boolean {
    return usage < parseInt(process.env.USER_MONTHLY_TOKEN_LIMIT || '30000000');
  }

  static checkUserTotalLimit(usage: number): boolean {
    return usage < parseInt(process.env.USER_TOTAL_TOKEN_LIMIT || '100000000');
  }

  static checkTeamDailyLimit(usage: number): boolean {
    return usage < parseInt(process.env.TEAM_DAILY_TOKEN_LIMIT || '5000000');
  }

  static checkTeamMonthlyLimit(usage: number): boolean {
    return usage < parseInt(process.env.TEAM_MONTHLY_TOKEN_LIMIT || '150000000');
  }

  static checkTeamTotalLimit(usage: number): boolean {
    return usage < parseInt(process.env.TEAM_TOTAL_TOKEN_LIMIT || '500000000');
  }

  static validateUserLimits(dailyUsage: number, monthlyUsage: number, totalUsage: number): boolean {
    return this.checkUserDailyLimit(dailyUsage) &&
           this.checkUserMonthlyLimit(monthlyUsage) &&
           this.checkUserTotalLimit(totalUsage);
  }

  static validateTeamLimits(dailyUsage: number, monthlyUsage: number, totalUsage: number): boolean {
    return this.checkTeamDailyLimit(dailyUsage) &&
           this.checkTeamMonthlyLimit(monthlyUsage) &&
           this.checkTeamTotalLimit(totalUsage);
  }
}
