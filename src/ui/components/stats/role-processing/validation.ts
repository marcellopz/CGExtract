import type { MatchesObj, TimelineObj, MatchRolesObj } from "./index";

/**
 * Results from validating match data integrity
 */
export interface ValidationResults {
  validMatches: string[]; // Match IDs that have all required data
  missingTimeline: string[]; // Match IDs missing timeline
  missingRoles: string[]; // Match IDs missing roles
  missingBoth: string[]; // Match IDs missing both
  skippedCount: number; // Total matches skipped
}

/**
 * Validation summary for display/logging
 */
export interface ValidationSummary {
  totalMatches: number;
  validMatches: number;
  processedMatches: number;
  skippedMatches: number;
  missingTimeline: number;
  missingRoles: number;
  missingBoth: number;
}

/**
 * Validates match data and throws an error if validation fails.
 * Logs validation results to console.
 *
 * This is the main validation function to use in the processing pipeline.
 * If validation passes, it does nothing. If it fails, it throws an error.
 *
 * @param matches - All match data
 * @param timelines - All timeline data
 * @param matchRoles - All role assignments
 * @throws Error if no valid matches are found
 */
export function validateMatchesData(
  matches: MatchesObj,
  timelines: TimelineObj,
  matchRoles: MatchRolesObj
): void {
  console.log("\n=== Data Integrity Validation ===");

  const results = validateMatchData(matches, timelines, matchRoles);

  console.log(
    `✓ Valid matches (complete data): ${results.validMatches.length}`
  );
  console.log(`✗ Matches missing timeline: ${results.missingTimeline.length}`);
  console.log(`✗ Matches missing roles: ${results.missingRoles.length}`);
  console.log(`✗ Matches missing both: ${results.missingBoth.length}`);

  // Log details of missing data
  if (results.missingTimeline.length > 0) {
    console.warn("Matches missing timeline:", results.missingTimeline);
  }
  if (results.missingRoles.length > 0) {
    console.warn("Matches missing roles:", results.missingRoles);
  }
  if (results.missingBoth.length > 0) {
    console.error(
      "Matches missing both timeline AND roles:",
      results.missingBoth
    );
  }

  // Throw error if no valid matches
  if (results.validMatches.length === 0) {
    throw new Error(
      `No valid matches to process! All ${
        Object.keys(matches).length
      } matches are missing required data. ` +
        `Missing timeline: ${results.missingTimeline.length}, ` +
        `Missing roles: ${results.missingRoles.length}, ` +
        `Missing both: ${results.missingBoth.length}`
    );
  }

  console.log(
    `\n✅ Validation passed! Processing ${results.validMatches.length} valid matches\n`
  );
}

/**
 * Validates that each match has both timeline and role assignments
 *
 * @param matches - All match data
 * @param timelines - All timeline data
 * @param matchRoles - All role assignments
 * @returns Validation results with categorized match IDs
 */
function validateMatchData(
  matches: MatchesObj,
  timelines: TimelineObj,
  matchRoles: MatchRolesObj
): ValidationResults {
  const validMatches: string[] = [];
  const missingTimeline: string[] = [];
  const missingRoles: string[] = [];
  const missingBoth: string[] = [];

  for (const matchId of Object.keys(matches)) {
    const hasTimeline = !!timelines[matchId];
    const hasRoles = !!matchRoles[matchId];

    if (hasTimeline && hasRoles) {
      validMatches.push(matchId);
    } else if (!hasTimeline && !hasRoles) {
      missingBoth.push(matchId);
    } else if (!hasTimeline) {
      missingTimeline.push(matchId);
    } else if (!hasRoles) {
      missingRoles.push(matchId);
    }
  }

  return {
    validMatches,
    missingTimeline,
    missingRoles,
    missingBoth,
    skippedCount:
      missingTimeline.length + missingRoles.length + missingBoth.length,
  };
}
