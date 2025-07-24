import { useAuth } from "../hooks/useAuth";
import "./UserProfile.css";

export function UserProfile() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="user-profile">
      <div className="user-info">
        {user.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="user-avatar" />
        ) : (
          <div className="user-avatar-placeholder">
            {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="user-details">
          <div className="user-name">
            {user.displayName || "Anonymous User"}
          </div>
          <div className="user-email">{user.email}</div>
        </div>
      </div>

      <button onClick={handleSignOut} className="sign-out-btn">
        Sign Out
      </button>
    </div>
  );
}
