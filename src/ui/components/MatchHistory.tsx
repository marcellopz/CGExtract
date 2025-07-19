import { useState } from "react";
import "./MatchHistory.css";
import { championNames } from "../constants/lcuData";

interface MatchParticipant {
  championId: number;
  spell1Id: number;
  spell2Id: number;
  stats: {
    champLevel: number;
    kills: number;
    deaths: number;
    assists: number;
    totalMinionsKilled: number;
    neutralMinionsKilled: number;
    totalDamageDealtToChampions: number;
    win: boolean;
    item0: number;
    item1: number;
    item2: number;
    item3: number;
    item4: number;
    item5: number;
    item6: number;
  };
}

interface MatchData {
  gameId: number;
  gameCreation: number;
  gameDuration: number;
  queueId: number;
  gameType?: string;
  participants: MatchParticipant[];
}

interface MatchHistory {
  games: {
    games: MatchData[];
  };
}

// Queue ID mappings
const queueNames: { [key: number]: string } = {
  420: "Ranked Solo",
  440: "Ranked Flex",
  450: "ARAM",
  400: "Normal Draft",
  430: "Normal Blind",
};

export function MatchHistory() {
  const [matchHistory, setMatchHistory] = useState<MatchHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchesPerPage, setMatchesPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(0);
  const [showCustomGamesOnly, setShowCustomGamesOnly] = useState(false);

  const loadMatchHistory = async (append = false) => {
    setLoading(true);
    setError(null);
    try {
      const begIndex = append ? (currentPage + 1) * matchesPerPage : 0;
      const endIndex = begIndex + matchesPerPage - 1;

      const history = await window.electron.getMatchHistory(
        undefined,
        begIndex,
        endIndex
      );

      if (append && matchHistory) {
        // Append new matches to existing ones
        setMatchHistory({
          games: {
            games: [...matchHistory.games.games, ...history.games.games],
          },
        });
        setCurrentPage((prev) => prev + 1);
      } else {
        // Replace with new matches
        setMatchHistory(history);
        setCurrentPage(0);
      }
    } catch (err) {
      setError("Failed to load match history");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMatches = () => {
    loadMatchHistory(true);
  };

  const downloadMatchDetails = async (match: MatchData) => {
    try {
      // Validate gameId before making API call
      if (!match.gameId || match.gameId === 0) {
        alert("Invalid game ID. Cannot download match details.");
        return;
      }

      console.log("Downloading match details for gameId:", match.gameId);

      // Fetch extended match details from LCU API
      const extendedMatchData = await window.electron.getDetailedMatch(
        match.gameId
      );
      console.log(extendedMatchData);

      // Download raw match details without additional metadata
      const dataStr = JSON.stringify(extendedMatchData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `match-detailed-${match.gameId}-${
        new Date(match.gameCreation).toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download detailed match data:", error);
      alert("Failed to download detailed match data. Please try again.");
    }
  };

  const downloadGameTimeline = async (match: MatchData) => {
    try {
      // Validate gameId before making API call
      if (!match.gameId || match.gameId === 0) {
        alert("Invalid game ID. Cannot download game timeline.");
        return;
      }

      console.log("Downloading game timeline for gameId:", match.gameId);

      // Fetch game timeline from LCU API
      const timelineData = await window.electron.getGameTimeline(match.gameId);
      console.log(timelineData);

      // Download raw timeline data
      const dataStr = JSON.stringify(timelineData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `match-timeline-${match.gameId}-${
        new Date(match.gameCreation).toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download game timeline:", error);
      alert("Failed to download game timeline. Please try again.");
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const getKDA = (participant: MatchParticipant) => {
    const { kills, deaths, assists } = participant.stats;
    const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;
    return kda.toFixed(2);
  };

  const getCS = (participant: MatchParticipant) => {
    return (
      participant.stats.totalMinionsKilled +
      participant.stats.neutralMinionsKilled
    );
  };

  // Filter matches based on custom games setting
  const getFilteredMatches = () => {
    if (!matchHistory) return [];

    let filteredMatches = matchHistory.games.games;

    if (showCustomGamesOnly) {
      filteredMatches = filteredMatches.filter(
        (match) => match.gameType === "CUSTOM_GAME"
      );
    }

    return filteredMatches;
  };

  const filteredMatches = getFilteredMatches();

  return (
    <div className="match-history">
      <div className="header">
        <h2>Match History</h2>
        <div className="controls">
          <div className="matches-per-page">
            <label htmlFor="matches-select">Matches per load:</label>
            <select
              id="matches-select"
              value={matchesPerPage}
              onChange={(e) => setMatchesPerPage(Number(e.target.value))}
              disabled={loading}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="filter-controls">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showCustomGamesOnly}
                onChange={(e) => setShowCustomGamesOnly(e.target.checked)}
              />
              <span>Custom Games Only</span>
            </label>
          </div>

          <button onClick={() => loadMatchHistory(false)} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {matchHistory && (
        <>
          <div className="match-summary">
            <span>
              Showing {filteredMatches.length} matches
              {showCustomGamesOnly && " (Custom Games only)"}
            </span>
          </div>

          <div className="matches">
            {filteredMatches.map((match) => {
              const player = match.participants[0]; // First participant is the player
              const isWin = player.stats.win;

              return (
                <div
                  key={match.gameId}
                  className={`match ${isWin ? "win" : "loss"}`}
                >
                  <div className="match-info">
                    <div className="queue-type">
                      {match.gameType === "CUSTOM_GAME"
                        ? "Custom Game"
                        : queueNames[match.queueId] || `Queue ${match.queueId}`}
                    </div>
                    <div className="time-info">
                      <div>{formatTimeAgo(match.gameCreation)}</div>
                      <div>{formatDuration(match.gameDuration)}</div>
                    </div>
                    <div className={`result ${isWin ? "victory" : "defeat"}`}>
                      {isWin ? "Victory" : "Defeat"}
                    </div>
                  </div>

                  <div className="match-details">
                    <div className="champion">
                      <img
                        src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${player.championId}.png`}
                        alt="Champion"
                        className="champion-icon"
                      />
                      <span>
                        {championNames[player.championId] ||
                          `Champion ${player.championId}`}
                      </span>
                    </div>

                    <div className="stats">
                      <div className="kda">
                        <span className="kills">{player.stats.kills}</span>/
                        <span className="deaths">{player.stats.deaths}</span>/
                        <span className="assists">{player.stats.assists}</span>
                        <div className="kda-ratio">{getKDA(player)} KDA</div>
                      </div>

                      <div className="cs">{getCS(player)} CS</div>

                      <div className="damage">
                        {Math.round(
                          player.stats.totalDamageDealtToChampions / 1000
                        )}
                        k DMG
                      </div>
                    </div>

                    <div className="items">
                      {[0, 1, 2, 3, 4, 5, 6].map((itemSlot) => {
                        const itemKey =
                          `item${itemSlot}` as keyof typeof player.stats;
                        const itemId = player.stats[itemKey] as number;
                        return (
                          <div key={itemSlot} className="item-slot">
                            {itemId > 0 && (
                              <img
                                src={`http://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/${itemId}.png`}
                                alt={`Item ${itemId}`}
                                className="item-icon"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="match-actions">
                    <button
                      className="download-btn"
                      onClick={() => void downloadMatchDetails(match)}
                      title="Download detailed match data as JSON"
                    >
                      📥
                    </button>
                    <button
                      className="download-btn timeline-btn"
                      onClick={() => void downloadGameTimeline(match)}
                      title="Download game timeline as JSON"
                    >
                      📊
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {!showCustomGamesOnly && filteredMatches.length > 0 && (
            <div className="load-more-section">
              <button
                className="load-more-btn"
                onClick={loadMoreMatches}
                disabled={loading}
              >
                {loading ? "Loading..." : `Load ${matchesPerPage} More Matches`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
