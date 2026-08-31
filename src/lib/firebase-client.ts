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
    if (!firebaseConfig.apiKey) {
        console.warn("[FIREBASE] NEXT_PUBLIC_FIREBASE_API_KEY non définie");
        return null;
    }
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
        throw new Error("Configuration Firebase manquante (vérifiez les variables NEXT_PUBLIC_FIREBASE_*).");
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
        prompt: "select_account",
    });

    try {
        const result = await signInWithPopup(auth, provider);
        return await result.user.getIdToken(true);
    } catch (error: any) {
        console.error("[FIREBASE_SIGNIN_ERROR]", error);
        if (error.code === "auth/popup-closed-by-user") {
            throw new Error("La fenêtre de connexion Google a été fermée.");
        }
        if (error.code === "auth/unauthorized-domain") {
            throw new Error(`Ce domaine (${window.location.hostname}) n'est pas autorisé dans la console Firebase (Authentication > Settings > Authorized domains).`);
        }
        if (error.code === "auth/popup-blocked") {
            throw new Error("Le popup de connexion Google a été bloqué par votre navigateur.");
        }
        throw new Error(error.message || "Erreur d'authentification Google");
    }
}