import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Defensive guard: if REACT_APP_BACKEND_URL is misconfigured with a trailing
// "/api" (e.g. https://kingdom-soul.com/api), every fetch ends up with a
// duplicated "/api/api/" prefix and 404s. Collapse it transparently here so
// the app keeps working regardless of how the env var was set at deploy time.
const _origFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  try {
    if (typeof input === "string" && input.includes("/api/api/")) {
      input = input.replace(/\/api\/api\//g, "/api/");
    } else if (input && typeof input === "object" && input.url && input.url.includes("/api/api/")) {
      input = new Request(input.url.replace(/\/api\/api\//g, "/api/"), input);
    }
  } catch (_) { /* no-op */ }
  return _origFetch(input, init);
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
