/**
 * Points calculator for the leaderboard
 */

// Point values for different activities
export const POINT_VALUES = {
  // General GitHub activity
  GENERAL_PR_CREATED: 1,
  GENERAL_PR_MERGED: 3,
  
  // NST-SDC specific activity (higher weights)
  ORG_PR_CREATED: 5,
  ORG_PR_MERGED: 15,
  ORG_COMMIT: 2,
};

export type ContributionData = {
  totalPRs: number;
  mergedPRs: number;
  contributions: number;
  orgPRs: number;
  orgMergedPRs: number;
};

export function calculatePoints(data: ContributionData): number {
  let totalPoints = 0;
  
  // Points for organization PRs (weighted higher)
  totalPoints += data.orgPRs * POINT_VALUES.ORG_PR_CREATED;
  totalPoints += data.orgMergedPRs * POINT_VALUES.ORG_PR_MERGED;
  
  // Points for general contributions
  totalPoints += data.contributions * POINT_VALUES.ORG_COMMIT;
  
  return Math.round(totalPoints);
}

export function getContributionLevel(points: number): string {
  if (points >= 200) return "Expert";
  if (points >= 100) return "Advanced";
  if (points >= 50) return "Intermediate";
  if (points >= 20) return "Beginner";
  return "Newcomer";
} 