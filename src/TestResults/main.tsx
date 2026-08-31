import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import { TestResults } from "./TestResults";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TestResults />
  </StrictMode>,
);
