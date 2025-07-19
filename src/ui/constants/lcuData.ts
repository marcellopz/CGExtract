// Champion ID to name mappings
// Champion ID to name mapping (simplified)
export const championNames: { [key: number]: string } = {
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
  26: "Zilean",
  27: "Singed",
  28: "Evelynn",
  29: "Twitch",
  30: "Karthus",
  31: "Chogath",
  32: "Amumu",
  33: "Rammus",
  34: "Anivia",
  35: "Shaco",
  36: "DrMundo",
  37: "Sona",
  38: "Kassadin",
  39: "Irelia",
  40: "Janna",
  41: "Gangplank",
  42: "Corki",
  43: "Karma",
  44: "Taric",
  45: "Veigar",
  48: "Trundle",
  50: "Swain",
  51: "Caitlyn",
  53: "Blitzcrank",
  54: "Malphite",
  55: "Katarina",
  56: "Nocturne",
  57: "Maokai",
  58: "Renekton",
  59: "JarvanIV",
  60: "Elise",
  61: "Orianna",
  62: "MonkeyKing",
  63: "Brand",
  64: "LeeSin",
  67: "Vayne",
  68: "Rumble",
  69: "Cassiopeia",
  72: "Skarner",
  74: "Heimerdinger",
  75: "Nasus",
  76: "Nidalee",
  77: "Udyr",
  78: "Poppy",
  79: "Gragas",
  80: "Pantheon",
  81: "Ezreal",
  82: "Mordekaiser",
  83: "Yorick",
  84: "Akali",
  85: "Kennen",
  86: "Garen",
  89: "Leona",
  90: "Malzahar",
  91: "Talon",
  92: "Riven",
  96: "KogMaw",
  98: "Shen",
  99: "Lux",
  101: "Xerath",
  102: "Shyvana",
  103: "Ahri",
  104: "Graves",
  105: "Fizz",
  106: "Volibear",
  107: "Rengar",
  110: "Varus",
  111: "Nautilus",
  112: "Viktor",
  113: "Sejuani",
  114: "Fiora",
  115: "Ziggs",
  117: "Lulu",
  119: "Draven",
  120: "Hecarim",
  121: "Khazix",
  122: "Darius",
  126: "Jayce",
  127: "Lissandra",
  131: "Diana",
  133: "Quinn",
  134: "Syndra",
  136: "AurelionSol",
  141: "Kayn",
  142: "Zoe",
  143: "Zyra",
  145: "Kaisa",
  147: "Seraphine",
  150: "Gnar",
  154: "Zac",
  157: "Yasuo",
  161: "Velkoz",
  163: "Taliyah",
  164: "Camille",
  166: "Akshan",
  200: "Belveth",
  201: "Braum",
  202: "Jhin",
  203: "Kindred",
  221: "Zeri",
  222: "Jinx",
  223: "TahmKench",
  233: "Briar",
  234: "Viego",
  235: "Senna",
  236: "Lucian",
  238: "Zed",
  240: "Kled",
  245: "Ekko",
  246: "Qiyana",
  254: "Vi",
  266: "Aatrox",
  267: "Nami",
  268: "Azir",
  350: "Yuumi",
  360: "Samira",
  412: "Thresh",
  420: "Illaoi",
  421: "RekSai",
  427: "Ivern",
  429: "Kalista",
  432: "Bard",
  497: "Rakan",
  498: "Xayah",
  516: "Ornn",
  517: "Sylas",
  518: "Neeko",
  523: "Aphelios",
  526: "Rell",
  555: "Pyke",
  711: "Vex",
  777: "Yone",
  799: "Ambessa",
  800: "Mel",
  804: "Yunara",
  875: "Sett",
  876: "Lillia",
  887: "Gwen",
  888: "Renata",
  893: "Aurora",
  895: "Nilah",
  897: "KSante",
  901: "Smolder",
  902: "Milio",
  910: "Hwei",
  950: "Naafiri",
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
