import { useState, useEffect } from "react";
import "./RoleAssignmentDialog.css";
import { championNames } from "../constants/lcuData";
import {
  type GameDetails,
  type PlayerForRoleAssignment as Player,
  type Role,
  type RoleAssignments,
} from "../../../gameTypes";

interface RoleAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleAssignments: RoleAssignments) => void;
  matchData: unknown;
  initialAssignments?: RoleAssignments;
}

const ROLES: Role[] = ["top", "jungle", "mid", "adc", "support"];
const ROLE_COLORS = ["#e74c3c", "#2ecc71", "#3498db", "#f39c12", "#9b59b6"];
const ROLE_NAMES = ["Top", "Jungle", "Mid", "ADC", "Support"];

export function RoleAssignmentDialog({
  isOpen,
  onClose,
  onSave,
  matchData,
  initialAssignments = {},
}: RoleAssignmentDialogProps) {
  const [team1Players, setTeam1Players] = useState<Player[]>([]);
  const [team2Players, setTeam2Players] = useState<Player[]>([]);
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
  const [draggedFromTeam, setDraggedFromTeam] = useState<1 | 2 | null>(null);

  useEffect(() => {
    if (matchData && isOpen) {
      extractPlayersFromMatchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchData, isOpen]);

  const extractPlayersFromMatchData = () => {
    try {
      // Try to parse as the new game details format first
      const gameDetails = matchData as GameDetails;

      if (gameDetails.participants && gameDetails.participantIdentities) {
        // New format with participantIdentities
        const extractedPlayers: Player[] = gameDetails.participants.map(
          (participant) => {
            // Find corresponding player identity
            const playerIdentity = gameDetails.participantIdentities.find(
              (identity) => identity.participantId === participant.participantId
            );

            const playerName =
              playerIdentity?.player?.gameName ||
              `Player ${participant.participantId}`;

            return {
              participantId: participant.participantId,
              summonerName: playerName,
              championId: participant.championId,
              championName:
                championNames[participant.championId] ||
                `Champion ${participant.championId}`,
              teamId: participant.teamId,
              position: 0, // Will be set after sorting
            };
          }
        );

        // Sort players by team and apply existing assignments or default positions
        const team1 = extractedPlayers.filter((p) => p.teamId === 100);
        const team2 = extractedPlayers.filter((p) => p.teamId === 200);

        // Apply existing role assignments or default order
        const sortedTeam1 = sortPlayersWithAssignments(
          team1,
          initialAssignments
        );
        const sortedTeam2 = sortPlayersWithAssignments(
          team2,
          initialAssignments
        );

        setTeam1Players(sortedTeam1);
        setTeam2Players(sortedTeam2);
        return;
      }

      // Fallback to old format extraction
      let participants: unknown[] = [];

      const data = matchData as Record<string, unknown>;
      if (Array.isArray(data.participants)) {
        participants = data.participants;
      } else if (
        data.info &&
        typeof data.info === "object" &&
        data.info !== null
      ) {
        const infoData = data.info as Record<string, unknown>;
        if (Array.isArray(infoData.participants)) {
          participants = infoData.participants;
        }
      } else if (
        data.gameInfo &&
        typeof data.gameInfo === "object" &&
        data.gameInfo !== null
      ) {
        const gameInfoData = data.gameInfo as Record<string, unknown>;
        if (Array.isArray(gameInfoData.participants)) {
          participants = gameInfoData.participants;
        }
      }

      const extractedPlayers: Player[] = participants.map(
        (participant: unknown, index: number) => {
          const p = participant as Record<string, unknown>;
          const participantId =
            (p.participantId as number) || (p.id as number) || index + 1;
          const teamId =
            (p.teamId as number) || (participantId <= 5 ? 100 : 200);

          // Try multiple possible field names for player name
          const playerName =
            (p.summonerName as string) ||
            (p.riotIdGameName as string) ||
            (p.gameName as string) ||
            `Player ${participantId}`;

          return {
            participantId,
            summonerName: playerName,
            championId: (p.championId as number) || 0,
            championName:
              (p.championName as string) ||
              championNames[p.championId as number] ||
              `Champion ${p.championId}`,
            teamId,
            position: 0, // Will be set after sorting
          };
        }
      );

      // Sort players by team and apply existing assignments or default positions
      const team1 = extractedPlayers.filter((p) => p.teamId === 100);
      const team2 = extractedPlayers.filter((p) => p.teamId === 200);

      // Apply existing role assignments or default order
      const sortedTeam1 = sortPlayersWithAssignments(team1, initialAssignments);
      const sortedTeam2 = sortPlayersWithAssignments(team2, initialAssignments);

      setTeam1Players(sortedTeam1);
      setTeam2Players(sortedTeam2);
    } catch (error) {
      console.error("Error extracting players from match data:", error);
      setTeam1Players([]);
      setTeam2Players([]);
    }
  };

  const sortPlayersWithAssignments = (
    teamPlayers: Player[],
    assignments: Record<number, Role>
  ): Player[] => {
    const playersWithPositions = teamPlayers.map((player) => {
      const assignedRole = assignments[player.participantId];
      const position = assignedRole ? ROLES.indexOf(assignedRole) : -1;
      return {
        ...player,
        position: position >= 0 ? position : teamPlayers.indexOf(player),
      };
    });

    // Sort by position, then by participant ID as fallback
    return playersWithPositions
      .sort(
        (a, b) => a.position - b.position || a.participantId - b.participantId
      )
      .map((player, index) => ({ ...player, position: index }));
  };

  const handleDragStart = (
    e: React.DragEvent,
    player: Player,
    teamNumber: 1 | 2
  ) => {
    setDraggedPlayer(player);
    setDraggedFromTeam(teamNumber);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (
    e: React.DragEvent,
    targetPlayer: Player,
    targetTeam: 1 | 2
  ) => {
    e.preventDefault();

    if (!draggedPlayer || !draggedFromTeam || draggedFromTeam !== targetTeam) {
      // Only allow swapping within the same team
      setDraggedPlayer(null);
      setDraggedFromTeam(null);
      return;
    }

    if (draggedPlayer.participantId === targetPlayer.participantId) {
      // Same player, no swap needed
      setDraggedPlayer(null);
      setDraggedFromTeam(null);
      return;
    }

    // Swap positions
    const teamPlayers = targetTeam === 1 ? team1Players : team2Players;
    const setTeamPlayers = targetTeam === 1 ? setTeam1Players : setTeam2Players;

    const draggedIndex = teamPlayers.findIndex(
      (p) => p.participantId === draggedPlayer.participantId
    );
    const targetIndex = teamPlayers.findIndex(
      (p) => p.participantId === targetPlayer.participantId
    );

    if (draggedIndex >= 0 && targetIndex >= 0) {
      const newTeamPlayers = [...teamPlayers];
      // Swap the players
      [newTeamPlayers[draggedIndex], newTeamPlayers[targetIndex]] = [
        newTeamPlayers[targetIndex],
        newTeamPlayers[draggedIndex],
      ];

      // Update positions
      newTeamPlayers.forEach((player, index) => {
        player.position = index;
      });

      setTeamPlayers(newTeamPlayers);
    }

    setDraggedPlayer(null);
    setDraggedFromTeam(null);
  };

  const handleSave = () => {
    // Generate role assignments for all players based on their positions
    const allAssignments: RoleAssignments = {};

    team1Players.forEach((player, index) => {
      allAssignments[player.participantId] = ROLES[index] || "top";
    });

    team2Players.forEach((player, index) => {
      allAssignments[player.participantId] = ROLES[index] || "top";
    });

    onSave(allAssignments);
    onClose();
  };

  const handleReset = () => {
    // Reset to default order (by participant ID)
    if (team1Players.length > 0) {
      const resetTeam1 = [...team1Players]
        .sort((a, b) => a.participantId - b.participantId)
        .map((player, index) => ({ ...player, position: index }));
      setTeam1Players(resetTeam1);
    }

    if (team2Players.length > 0) {
      const resetTeam2 = [...team2Players]
        .sort((a, b) => a.participantId - b.participantId)
        .map((player, index) => ({ ...player, position: index }));
      setTeam2Players(resetTeam2);
    }
  };

  const getChampionImageUrl = (championId: number) => {
    return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png`;
  };

  if (!isOpen) return null;

  return (
    <div className="role-dialog-overlay" onClick={onClose}>
      <div className="role-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="role-dialog-header">
          <h2>Arrange Team Roles</h2>
          <p>Drag players within their team to assign roles (Top → Support)</p>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="role-dialog-content">
          <div className="teams-container">
            {/* Team 1 (Blue) */}
            <div className="team-column">
              <div className="team-header team-blue">
                <h3>Blue Team</h3>
              </div>
              <div className="players-column">
                {team1Players.map((player, index) => (
                  <div
                    key={player.participantId}
                    className="player-row"
                    draggable
                    onDragStart={(e) => handleDragStart(e, player, 1)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, player, 1)}
                  >
                    <div
                      className="role-indicator"
                      style={{ backgroundColor: ROLE_COLORS[index] }}
                    >
                      {ROLE_NAMES[index]}
                    </div>
                    <div className="player-card">
                      <img
                        src={getChampionImageUrl(player.championId)}
                        alt="Champion"
                        className="champion-image"
                      />
                      <div className="player-details">
                        <span className="player-name">
                          {player.summonerName}
                        </span>
                        <span className="champion-name">
                          {player.championName}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team 2 (Red) */}
            <div className="team-column">
              <div className="team-header team-red">
                <h3>Red Team</h3>
              </div>
              <div className="players-column">
                {team2Players.map((player, index) => (
                  <div
                    key={player.participantId}
                    className="player-row"
                    draggable
                    onDragStart={(e) => handleDragStart(e, player, 2)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, player, 2)}
                  >
                    <div
                      className="role-indicator"
                      style={{ backgroundColor: ROLE_COLORS[index] }}
                    >
                      {ROLE_NAMES[index]}
                    </div>
                    <div className="player-card">
                      <img
                        src={getChampionImageUrl(player.championId)}
                        alt="Champion"
                        className="champion-image"
                      />
                      <div className="player-details">
                        <span className="player-name">
                          {player.summonerName}
                        </span>
                        <span className="champion-name">
                          {player.championName}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="role-dialog-footer">
          <div className="assignment-status">
            <span className="status-info">
              All 10 players will be assigned roles based on their positions
            </span>
          </div>
          <div className="dialog-actions">
            <button className="reset-button" onClick={handleReset}>
              Reset to Default Order
            </button>
            <button className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button className="save-button" onClick={handleSave}>
              Save Role Assignments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
