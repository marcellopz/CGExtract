import { useState } from "react";
import "./App.css";
import { LCUStatus } from "./components/LCUStatus";
import { SummonerProfile } from "./components/SummonerProfile";
import { MatchHistory } from "./components/MatchHistory";
import { BulkTimelineDownload } from "./components/BulkTimelineDownload";

function App() {
  const [activeTab, setActiveTab] = useState("status");

  const tabs = [
    { id: "status", label: "LCU Status", component: <LCUStatus /> },
    {
      id: "profile",
      label: "Summoner Profile",
      component: <SummonerProfile />,
    },
    { id: "matches", label: "Match History", component: <MatchHistory /> },
    { id: "bulk", label: "Bulk Timeline", component: <BulkTimelineDownload /> },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <h1>CGExtract - League Client Data Extractor</h1>
        <p>Extract and analyze data from the League of Legends client</p>
      </header>

      <nav className="tab-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="app-content">
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </main>
    </div>
  );
}

export default App;
