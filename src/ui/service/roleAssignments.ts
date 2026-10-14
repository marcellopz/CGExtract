import type { RoleAssignments } from "../../../gameTypes";

/**
 * Role assignments coming out of the RoleAssignmentDialog are keyed by
 * participantId. The backend stores them keyed by summonerId, so this maps
 * one to the other using the match's participantIdentities.
 */
export function transformRoleAssignments(
  roleAssignments: RoleAssignments,
  gameData: unknown
): RoleAssignments {
  try {
    const data = gameData as Record<string, unknown>;

    // Check if we have participantIdentities to map participantId to summonerId
    if (
      !data?.participantIdentities ||
      !Array.isArray(data.participantIdentities)
    ) {
      console.warn(
        "No participantIdentities found, returning original assignments"
      );
      return roleAssignments;
    }

    const participantIdentities = data.participantIdentities as unknown[];
    const transformedAssignments: RoleAssignments = {};

    // Map each participantId to summonerId
    Object.entries(roleAssignments).forEach(([participantIdStr, role]) => {
      const participantId = parseInt(participantIdStr);

      // Find the corresponding participant identity
      const participantIdentity = participantIdentities.find(
        (identity: unknown) => {
          const id = identity as Record<string, unknown>;
          return id.participantId === participantId;
        }
      ) as Record<string, unknown> | undefined;

      const player = participantIdentity?.player as
        | Record<string, unknown>
        | undefined;
      const summonerId = player?.summonerId as number | undefined;

      if (summonerId) {
        transformedAssignments[summonerId] = role;
      } else {
        console.warn(
          `Could not find summonerId for participantId ${participantId}`
        );
        // Fallback: keep the original participantId as key
        transformedAssignments[participantId] = role;
      }
    });

    return transformedAssignments;
  } catch (error) {
    console.error("Error transforming role assignments:", error);
    return roleAssignments; // Return original if transformation fails
  }
}
