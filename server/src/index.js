import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

import scanRouter from "./routes/scan.js";
import generateRouter from "./routes/generate.js";
import marketplaceRouter from "./routes/marketplace.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.join(__dirname, "../../landingpage-dashboard");

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

app.use("/api/scan", scanRouter);
app.use("/api/generate", generateRouter);
app.use("/api/marketplace", marketplaceRouter);

app.use(express.static(staticDir));

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`ReThread AI server running on http://localhost:${port}`);
});
