import { useState, useEffect } from "react";
import "./StatsManager.css";
import { recalculateStats, getOverviewData } from "./stats";

interface OverviewData {
  totalPlayers: number;
  numberOfGames: number;
  lastGameDate: string | null;
}

export function StatsManager() {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [overviewData, setOverviewData] = useState<OverviewData>({
    totalPlayers: 0,
    numberOfGames: 0,
    lastGameDate: null,
  });
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);

  const fetchOverviewData = async () => {
    try {
      setIsLoadingOverview(true);
      const data = await getOverviewData();
      setOverviewData(data);
    } catch (error) {
      console.error("Failed to fetch overview data:", error);
    } finally {
      setIsLoadingOverview(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const handleRecalculateStats = async () => {
    if (isRecalculating) return; // Prevent multiple clicks

    setIsRecalculating(true);
    try {
      await recalculateStats();
      // Refresh overview data after recalculation
      // await fetchOverviewData();
    } catch (error) {
      console.error("Failed to recalculate stats:", error);
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleAddPlayer = () => {
    // TODO: Implement add player functionality
    console.log("Add player clicked");
  };

  const handleEditPlayer = () => {
    // TODO: Implement edit player functionality
    console.log("Edit player clicked");
  };

  const formatLastGameDate = (dateString: string | null): string => {
    if (!dateString) return "Never";

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return "Today";
      if (diffDays === 2) return "Yesterday";
      if (diffDays <= 7) return `${diffDays - 1} days ago`;

      return date.toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="stats-manager">
      <div className="stats-actions">
        <div className="action-section">
          <h3>Data Management</h3>
          <button
            className={`btn-primary recalculate-btn ${
              isRecalculating ? "loading" : ""
            }`}
            onClick={handleRecalculateStats}
            disabled={isRecalculating}
          >
            {isRecalculating && <div className="loading-spinner"></div>}
            {isRecalculating ? "Recalculating..." : "Recalculate All Stats"}
          </button>
          <p className="action-description">
            Recalculate statistics for all players across all custom games
          </p>
        </div>

        <div className="action-section">
          <h3>Player Management</h3>
          <div className="player-actions">
            <button
              className="btn-secondary add-player-btn"
              onClick={handleAddPlayer}
            >
              Add Player
            </button>
            <button
              className="btn-secondary edit-player-btn"
              onClick={handleEditPlayer}
            >
              Edit Player
            </button>
          </div>
          <p className="action-description">
            Add new players or edit existing player information
          </p>
        </div>
      </div>

      <div className="stats-overview">
        <h3>Quick Overview</h3>
        <div className="overview-cards">
          <div className="overview-card">
            <div className="card-title">Total Players</div>
            <div className="card-value">
              {isLoadingOverview ? "..." : overviewData.totalPlayers}
            </div>
          </div>
          <div className="overview-card">
            <div className="card-title">Custom Games</div>
            <div className="card-value">
              {isLoadingOverview ? "..." : overviewData.numberOfGames}
            </div>
          </div>
          <div className="overview-card">
            <div className="card-title">Last Updated</div>
            <div className="card-value">
              {isLoadingOverview
                ? "..."
                : formatLastGameDate(overviewData.lastGameDate)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
