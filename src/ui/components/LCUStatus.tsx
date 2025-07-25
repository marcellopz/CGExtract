import { useState, useEffect } from "react";
import "./LCUStatus.css";

interface LCUStatusProps {
  className?: string;
}

interface LCUAuth {
  name: string;
  protocol: string;
  pid: string;
  port: string;
  password: string;
}

export function LCUStatus({ className }: LCUStatusProps) {
  const [connected, setConnected] = useState(false);
  const [auth, setAuth] = useState<LCUAuth | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial auth check
    const checkAuth = async () => {
      try {
        const authData = await window.electron.getLCUAuth();
        console.log("authData", authData);
        setAuth(authData);
        setConnected(authData !== null);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to connect to League client");
        setConnected(false);
        setAuth(null);
      }
    };

    checkAuth();

    // Subscribe to auth status changes
    const unsubscribeAuth = window.electron.subscribeToLCU(
      "lcu-auth-status",
      (data) => {
        setConnected(data.connected);
        setAuth(data.auth);
        if (data.connected) {
          setError(null);
        }
      }
    );

    // Subscribe to errors
    const unsubscribeError = window.electron.subscribeToLCU(
      "lcu-error",
      (data) => {
        setError(data.error);
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribeError();
    };
  }, []);

  return (
    <div className={`lcu-status ${className || ""}`}>
      <div className="status-indicator">
        <div
          className={`status-dot ${connected ? "connected" : "disconnected"}`}
        />
        <span className="status-text">
          {connected ? "League Client Connected" : "League Client Disconnected"}
        </span>
      </div>

      {auth && (
        <div className="auth-info">
          <small>
            Port: {auth.port} | PID: {auth.pid}
          </small>
        </div>
      )}

      {error && (
        <div className="error-message">
          <small style={{ color: "red" }}>{error}</small>
        </div>
      )}
    </div>
  );
}
