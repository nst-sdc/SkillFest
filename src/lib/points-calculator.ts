/**
 * Points calculator for the leaderboard
 */

// Point values for different activities
export const POINT_VALUES = {
  // General GitHub activity (open source, not NST-SDC)
  GENERAL_PR_CREATED: 5,
  GENERAL_PR_MERGED: 7,
  
  // NST-SDC specific activity
  ORG_PR_CREATED: 10,
  ORG_PR_MERGED: 15,
};

export type ContributionData = {
  totalPRs: number;
  mergedPRs: number;
  contributions: number; // Keeping for backward compatibility
  orgPRs: number;
  orgMergedPRs: number;
};

export function calculatePoints(data: {
  totalPRs: number;
  mergedPRs: number;
  contributions: number; // Keeping for backward compatibility
  orgPRs: number;
  orgMergedPRs: number;
}): number {
  // Ensure all values are numbers and not undefined/null
  const totalPRs = Number(data.totalPRs) || 0;
  const mergedPRs = Number(data.mergedPRs) || 0;
  const orgPRs = Number(data.orgPRs) || 0;
  const orgMergedPRs = Number(data.orgMergedPRs) || 0;
  
  // Calculate points for organization PRs
  const orgPRPoints = orgPRs * POINT_VALUES.ORG_PR_CREATED;
  const orgMergedPRPoints = orgMergedPRs * POINT_VALUES.ORG_PR_MERGED;
  
  // Calculate points for general PRs (non-organization)
  // We need to calculate the number of general PRs by subtracting org PRs from total PRs
  const generalPRs = Math.max(0, totalPRs - orgPRs);
  
  // Calculate general merged PRs correctly
  const generalMergedPRs = Math.max(0, mergedPRs - orgMergedPRs);
  
  // Calculate points for each category
  const generalPRPoints = generalPRs * POINT_VALUES.GENERAL_PR_CREATED;
  const generalMergedPRPoints = generalMergedPRs * POINT_VALUES.GENERAL_PR_MERGED;
  
  // Sum up all points
  const totalPoints = orgPRPoints + orgMergedPRPoints + generalPRPoints + generalMergedPRPoints;
  
  // Add detailed logging to help diagnose issues
  console.log(`Points calculation for user with ${totalPRs} total PRs:`, {
    totalPRs,
    orgPRs,
    generalPRs: totalPRs - orgPRs,
    mergedPRs,
    orgMergedPRs,
    generalMergedPRs: mergedPRs - orgMergedPRs,
    orgPRPoints,
    orgMergedPRPoints,
    generalPRPoints,
    generalMergedPRPoints,
    totalPoints
  });
  
  return totalPoints;
}

export function getContributionLevel(points: number): string {
  if (points >= 200) return "Expert";
  if (points >= 100) return "Advanced";
  if (points >= 50) return "Intermediate";
  if (points >= 20) return "Beginner";
  return "Newcomer";
} 