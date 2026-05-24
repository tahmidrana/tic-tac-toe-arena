import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { loadOpponentNames } from "./utils/opponentNames";

// Fire-and-forget: populate the opponent name pool from Firestore.
// Falls back to the baked-in list if Firebase isn't configured or fetch fails.
loadOpponentNames();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
