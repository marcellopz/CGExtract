// Champion ID to name mappings
export const championIds: { [key: number]: string } = {
  1: "Annie",
  2: "Olaf",
  3: "Galio",
  4: "TwistedFate",
  5: "XinZhao",
  6: "Urgot",
  7: "Leblanc",
  8: "Vladimir",
  9: "Fiddlesticks",
  10: "Kayle",
  11: "MasterYi",
  12: "Alistar",
  13: "Ryze",
  14: "Sion",
  15: "Sivir",
  16: "Soraka",
  17: "Teemo",
  18: "Tristana",
  19: "Warwick",
  20: "Nunu",
  21: "MissFortune",
  22: "Ashe",
  23: "Tryndamere",
  24: "Jax",
  25: "Morgana",
  // Add more champions as needed
};

// Queue ID mappings
export const queueIds: { [key: number]: string } = {
  0: "",
  2: "Blind Pick",
  4: "Ranked Solo",
  6: "Ranked Premade",
  7: "Co-op vs AI",
  8: "3v3 Normal",
  14: "Draft Pick",
  65: "ARAM",
  400: "Draft Pick",
  420: "Ranked Solo",
  430: "Blind Pick",
  440: "Ranked Flex",
  450: "ARAM",
  700: "Clash",
  1400: "Ultimate Spellbook",
};

// Summoner spell mappings
export const summonerSpells: { [key: number]: string } = {
  1: "Cleanse",
  3: "Exhaust",
  4: "Flash",
  6: "Ghost",
  7: "Heal",
  11: "Smite",
  12: "Teleport",
  13: "Clarity",
  14: "Ignite",
  21: "Barrier",
  32: "Mark",
};

// Rank divisions
export const romanNumbers: { [key: string]: number } = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
};

// Asset URLs
const patch = "14.1.1";
export const ITEMICONURL = `http://ddragon.leagueoflegends.com/cdn/${patch}/img/item/`;
export const PROFILEPICONURL =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/";
export const CHAMPIONICONURL =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/";
export const RUNEICONURL =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/";

// Helper functions
export const formatGameDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${minutes}m ago`;
};

export const calculateKDA = (
  kills: number,
  deaths: number,
  assists: number
): string => {
  const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;
  return kda.toFixed(2);
};

export const calculateWinRate = (wins: number, losses: number): number => {
  if (wins + losses === 0) return 0;
  return Math.round((wins / (wins + losses)) * 100);
};

export const formatRank = (
  tier: string,
  division: string,
  leaguePoints: number
): string => {
  if (!tier || tier === "UNRANKED") {
    return "Unranked";
  }
  return `${tier} ${division} (${leaguePoints} LP)`;
};
