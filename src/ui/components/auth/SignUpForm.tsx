import { useState } from "react";
import "./LoginForm.css";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  updateProfile,
} from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";

const provider = new GoogleAuthProvider();

interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function SignUpForm({ onSuccess, onSwitchToLogin }: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }

      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Sign up failed";
      setError(errorMessage);
      console.error("Sign up error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Using your exact website code!
  const signInGoogle = async () => {
    setLoading(true);
    setError(null);

    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      const user_ = result.user;

      if (token) {
        localStorage.setItem("@AuthFirebase:token", token);
      }
      localStorage.setItem("@AuthFirebase:user", JSON.stringify(user_));

      onSuccess?.();
    } catch (error: unknown) {
      console.error("Google sign-in error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Google sign-in failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form">
      <h2>Create Account</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="displayName">Display Name (Optional)</label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={loading}
            placeholder="Enter your display name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            placeholder="Enter your password (min 6 characters)"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            placeholder="Confirm your password"
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <div className="divider">
        <span>or</span>
      </div>

      <button onClick={signInGoogle} disabled={loading} className="btn-google">
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 8.18v2.93h4.92c-.2 1.07-.81 1.98-1.72 2.59v2.15h2.79c1.63-1.5 2.57-3.71 2.57-6.33 0-.61-.05-1.2-.15-1.77H9V8.18z"
            fill="#4285F4"
          />
          <path
            d="M3.96 10.75L3.27 11.3 1.09 13.02c1.69 3.34 5.14 5.64 9.91 5.64 2.99 0 5.5-1 7.33-2.7l-2.79-2.15c-.77.52-1.76.83-2.88.83-2.22 0-4.1-1.5-4.77-3.51L3.96 10.75z"
            fill="#34A853"
          />
          <path
            d="M3.96 10.75c-.47-1.39-.47-2.89 0-4.28L7.89 3.2c.67-2.01 2.55-3.51 4.77-3.51 1.25 0 2.38.45 3.27 1.33l2.41-2.41C16.5 1.39 14.01.33 11.01.33c-4.77 0-8.22 2.3-9.91 5.64L3.96 10.75z"
            fill="#FBBC05"
          />
          <path
            d="M11.01.33c2.99 0 5.48 1.06 7.32 2.83l-2.41 2.41c-.89-.88-2.02-1.33-3.27-1.33-2.22 0-4.1 1.5-4.77 3.51L3.96 6.47C5.65 3.13 9.1.83 13.87.83h-2.86z"
            fill="#EA4335"
          />
        </svg>
        {loading ? "Signing In..." : "Continue with Google"}
      </button>

      <div className="form-footer">
        <p>
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="link-button"
            disabled={loading}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
