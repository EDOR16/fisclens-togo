import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, type Auth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialisation sécurisée et lazy pour éviter les erreurs au moment du build statique / SSG (ex: Vercel)
export function getFirebaseApp(): FirebaseApp | null {
    if (typeof window === "undefined") return null;
    if (!firebaseConfig.apiKey) return null;
    try {
        return getApps().length ? getApp() : initializeApp(firebaseConfig);
    } catch (e) {
        console.error("[FIREBASE_INIT_ERROR]", e);
        return null;
    }
}

export function getFirebaseAuth(): Auth | null {
    const app = getFirebaseApp();
    if (!app) return null;
    try {
        return getAuth(app);
    } catch (e) {
        console.error("[FIREBASE_AUTH_ERROR]", e);
        return null;
    }
}

/**
 * Ouvre le popup Google, retourne l'ID token Firebase à envoyer
 * à /api/v1/auth/firebase pour vérification côté serveur.
 */
export async function signInWithGoogle(): Promise<string> {
    const auth = getFirebaseAuth();
    if (!auth) {
        throw new Error("La connexion Google n'est pas disponible (clé Firebase non configurée).");
    }
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user.getIdToken();
}