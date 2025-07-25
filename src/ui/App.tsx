import { useState } from "react";
import "./App.css";
import { LCUStatus } from "./components/LCUStatus";
import { SummonerProfile } from "./components/SummonerProfile";
import { MatchHistory } from "./components/MatchHistory";
import { BulkTimelineDownload } from "./components/BulkTimelineDownload";
import { GameDataUpload } from "./components/GameDataUpload";
import { AuthProvider } from "./components/auth/AuthProvider";
import { UserProfile } from "./components/UserProfile";
import { AuthModal } from "./components/auth/AuthModal";
import { useAuth } from "./hooks/useAuth";

function AppContent() {
  const [activeTab, setActiveTab] = useState("status");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading } = useAuth();

  const tabs = [
    { id: "status", label: "LCU Status", component: <LCUStatus /> },
    {
      id: "profile",
      label: "Summoner Profile",
      component: <SummonerProfile />,
    },
    { id: "matches", label: "Match History", component: <MatchHistory /> },
    { id: "bulk", label: "Bulk Timeline", component: <BulkTimelineDownload /> },
    { id: "upload", label: "Game Data Upload", component: <GameDataUpload /> },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-text">
            <h1>CGExtract - League Client Data Extractor</h1>
            <p>Extract and analyze data from the League of Legends client</p>
          </div>

          <div className="header-auth">
            {loading ? (
              <div className="auth-loading">Loading...</div>
            ) : user ? (
              <UserProfile />
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="auth-button"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
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

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
