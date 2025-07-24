import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

const provider = new GoogleAuthProvider();

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);

      if (user) {
        // Store user data locally
        localStorage.setItem(
          "@AuthFirebase:user",
          JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          })
        );
      } else {
        localStorage.removeItem("@AuthFirebase:user");
        localStorage.removeItem("@AuthFirebase:token");
      }
    });

    return unsubscribe;
  }, []);

  const signInGoogle = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      const user_ = result.user;

      setUser(user_);
      if (token) {
        localStorage.setItem("@AuthFirebase:token", token);
      }
      localStorage.setItem(
        "@AuthFirebase:user",
        JSON.stringify({
          uid: user_.uid,
          email: user_.email,
          displayName: user_.displayName,
          photoURL: user_.photoURL,
        })
      );

      return { success: true };
    } catch (error) {
      console.error("Google sign-in error:", error);
      return { success: false, error: error.message };
    }
  };

  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithEmailAndPassword(auth, email, password);
      setUser(result.user);
      return { success: true };
    } catch (error) {
      console.error("Email sign-in error:", error);
      return { success: false, error: error.message };
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<{ success: boolean; error?: string }> => {
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

      setUser(result.user);
      return { success: true };
    } catch (error) {
      console.error("Email sign-up error:", error);
      return { success: false, error: error.message };
    }
  };

  const signOutUser = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem("@AuthFirebase:user");
      localStorage.removeItem("@AuthFirebase:token");
      return { success: true };
    } catch (error) {
      console.error("Sign-out error:", error);
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    loading,
    signInGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut: signOutUser,
  };
}
