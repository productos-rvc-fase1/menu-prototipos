// ─────────────────────────────────────────────────────────
// firebase-config.js  —  Proyecto: rvc-app-web-fase1
// Configuracion del proyecto - Tus apps - SDK de Firebase
// ─────────────────────────────────────────────────────────

import { initializeApp }  from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBp_e2aWgLpUWJZJShIMyRdTvgzKBTKDh4",
  authDomain: "rvc-app-web-fase1.firebaseapp.com",
  projectId: "rvc-app-web-fase1",
  storageBucket: "rvc-app-web-fase1.firebasestorage.app",
  messagingSenderId: "1011005178034",
  appId: "1:1011005178034:web:8ce83c139f1766b121c9ab"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);