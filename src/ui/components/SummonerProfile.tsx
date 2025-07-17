import { useState } from "react";
import "./SummonerProfile.css";

interface SummonerData {
  summonerId: number;
  displayName: string;
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
  accountId: number;
}

interface RankedQueue {
  tier: string;
  division: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

interface RankedStats {
  queueMap: {
    RANKED_SOLO_5x5: RankedQueue;
    RANKED_FLEX_SR: RankedQueue;
  };
}

export function SummonerProfile() {
  const [summoner, setSummoner] = useState<SummonerData | null>(null);
  const [rankedStats, setRankedStats] = useState<RankedStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchName, setSearchName] = useState("");

  const getCurrentSummoner = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentSummoner = await window.electron.getCurrentSummoner();
      setSummoner(currentSummoner);

      const stats = await window.electron.getRankedStats();
      setRankedStats(stats);
    } catch (err) {
      setError("Failed to load current summoner");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const searchSummoner = async (name: string) => {
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const foundSummoner = await window.electron.searchSummoner(name);
      setSummoner(foundSummoner);

      const stats = await window.electron.getRankedStats(foundSummoner.puuid);
      setRankedStats(stats);
    } catch (err) {
      setError(`Summoner "${name}" not found`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchSummoner(searchName);
  };

  const formatRank = (queue: RankedQueue) => {
    if (!queue || queue.tier === "UNRANKED") {
      return "Unranked";
    }
    return `${queue.tier} ${queue.division} (${queue.leaguePoints} LP)`;
  };

  const getWinRate = (queue: RankedQueue) => {
    if (!queue || queue.wins + queue.losses === 0) return 0;
    return Math.round((queue.wins / (queue.wins + queue.losses)) * 100);
  };

  return (
    <div className="summoner-profile">
      <h2>Summoner Profile</h2>

      <div className="controls">
        <button onClick={getCurrentSummoner} disabled={loading}>
          Load Current Player
        </button>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Search summoner..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !searchName.trim()}>
            Search
          </button>
        </form>
      </div>

      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error">{error}</div>}

      {summoner && (
        <div className="summoner-info">
          <div className="basic-info">
            <img
              src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${summoner.profileIconId}.jpg`}
              alt="Profile"
              className="profile-icon"
            />
            <div>
              <h3>{summoner.displayName}</h3>
              <p>Level {summoner.summonerLevel}</p>
            </div>
          </div>

          {rankedStats && (
            <div className="ranked-info">
              <h4>Ranked Statistics</h4>

              <div className="queue-stats">
                <div className="queue">
                  <h5>Solo/Duo Queue</h5>
                  <p>{formatRank(rankedStats.queueMap.RANKED_SOLO_5x5)}</p>
                  <p>
                    {rankedStats.queueMap.RANKED_SOLO_5x5.wins}W /{" "}
                    {rankedStats.queueMap.RANKED_SOLO_5x5.losses}L
                  </p>
                  <p>{getWinRate(rankedStats.queueMap.RANKED_SOLO_5x5)}% WR</p>
                </div>

                <div className="queue">
                  <h5>Flex Queue</h5>
                  <p>{formatRank(rankedStats.queueMap.RANKED_FLEX_SR)}</p>
                  <p>
                    {rankedStats.queueMap.RANKED_FLEX_SR.wins}W /{" "}
                    {rankedStats.queueMap.RANKED_FLEX_SR.losses}L
                  </p>
                  <p>{getWinRate(rankedStats.queueMap.RANKED_FLEX_SR)}% WR</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
