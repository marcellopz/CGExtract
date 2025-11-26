/**
 * TypeScript type definitions for League of Legends Match Timeline data
 * Generated from JSON timeline files
 */

/**
 * Position on the map
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Event types that can occur during a match
 */
export type EventType =
  | "CHAMPION_KILL"
  | "ELITE_MONSTER_KILL"
  | "BUILDING_KILL";

/**
 * Monster types for elite monster kills
 */
export type MonsterType =
  | "DRAGON"
  | "BARON_NASHOR"
  | "RIFTHERALD"
  | "HORDE"
  | "ATAKHAN"
  | "";

/**
 * Dragon sub-types
 */
export type MonsterSubType =
  | "FIRE_DRAGON"
  | "WATER_DRAGON"
  | "AIR_DRAGON"
  | "EARTH_DRAGON"
  | "HEXTECH_DRAGON"
  | "CHEMTECH_DRAGON"
  | "ELDER_DRAGON"
  | "";

/**
 * Building types for building destruction events
 */
export type BuildingType = "TOWER_BUILDING" | "INHIBITOR_BUILDING" | "";

/**
 * Tower types for turret destruction
 */
export type TowerType =
  | "OUTER_TURRET"
  | "INNER_TURRET"
  | "BASE_TURRET"
  | "NEXUS_TURRET"
  | "";

/**
 * Lane types for building and kill events
 */
export type LaneType = "TOP_LANE" | "MID_LANE" | "BOT_LANE" | "";

/**
 * Team IDs in League of Legends
 */
export type TeamId = 100 | 200 | 0;

/**
 * Timeline event that occurs during a match
 */
export interface TimelineEvent {
  /** IDs of participants who assisted in the event (e.g., kill assists) */
  assistingParticipantIds: number[];

  /** Type of building involved in the event */
  buildingType: BuildingType;

  /** Item ID associated with the event */
  itemId: number;

  /** Participant ID of the killer */
  killerId: number;

  /** Lane where the event occurred */
  laneType: LaneType;

  /** Sub-type of the monster (for elite monster kills) */
  monsterSubType: MonsterSubType;

  /** Type of monster killed */
  monsterType: MonsterType;

  /** Participant ID (0 for non-participant events) */
  participantId: number;

  /** Position on the map where the event occurred */
  position: Position;

  /** Skill slot used (0-3 for Q, W, E, R) */
  skillSlot: number;

  /** Team ID associated with the event */
  teamId: TeamId; // only used for BUILDING_KILL events

  /** Timestamp in milliseconds when the event occurred */
  timestamp: number;

  /** Type of tower involved in building kills */
  towerType: TowerType;

  /** Type of event */
  type: EventType;

  /** Participant ID of the victim (for kill events) */
  victimId: number;
}

/**
 * Statistics for a single participant at a specific point in time
 */
export interface ParticipantFrame {
  /** Current gold held by the participant */
  currentGold: number;

  /** Dominion score (typically 0 for Summoner's Rift) */
  dominionScore: number;

  /** Number of jungle minions killed */
  jungleMinionsKilled: number;

  /** Current champion level */
  level: number;

  /** Number of lane minions killed */
  minionsKilled: number;

  /** Participant ID (1-10) */
  participantId: number;

  /** Current position on the map */
  position: Position;

  /** Team score (typically 0) */
  teamScore: number;

  /** Total gold earned throughout the game */
  totalGold: number;

  /** Current experience points */
  xp: number;
}

/**
 * Collection of all participant frames at a specific point in time
 * Keys are participant IDs as strings ("1" through "10")
 */
export interface ParticipantFrames {
  [participantId: string]: ParticipantFrame;
}

/**
 * A single frame in the timeline representing a snapshot at a specific time
 */
export interface TimelineFrame {
  /** Events that occurred during this time interval */
  events?: TimelineEvent[];

  /** Statistics for all participants at this point in time */
  participantFrames: ParticipantFrames;

  /** Timestamp in milliseconds for this frame */
  timestamp: number;
}

/**
 * Complete match timeline containing all frames and events
 */
export interface Timeline {
  /** Array of timeline frames, typically captured every 60 seconds */
  frames: TimelineFrame[];
}
