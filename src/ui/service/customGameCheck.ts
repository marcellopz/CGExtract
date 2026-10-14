export function isCustomGame(matchData: unknown): boolean {
  const data = matchData as Record<string, unknown> | null | undefined;
  return data?.gameType === "CUSTOM_GAME";
}

/**
 * Asks the user to confirm uploading match(es) that are not custom games,
 * since the app was not designed for them. Returns true if it's fine to continue.
 */
export function confirmNonCustomUpload(descriptions: string[]): boolean {
  if (descriptions.length === 0) return true;

  const list = descriptions.map((d) => `• ${d}`).join("\n");
  const subject =
    descriptions.length === 1
      ? "This match is not a custom game"
      : `${descriptions.length} of these matches are not custom games`;

  return window.confirm(
    `${subject}:\n\n${list}\n\nThis app was not made for non-custom games. Do you really want to upload?`
  );
}
