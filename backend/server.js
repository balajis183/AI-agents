// server.js
import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Allow configuring an origin via .env (use '*' for dev)
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: CORS_ORIGIN }));

app.use(express.json());

const PORT = process.env.PORT || 4000;
const LYZR_API_KEY = process.env.LYZR_API_KEY; // set in .env
const LYZR_API_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";

if (!LYZR_API_KEY) {
  console.warn(
    "Warning: LYZR_API_KEY is not set. Create a .env with your key."
  );
}

// Simple runtime metrics
const startTime = Date.now();
let requestCount = 0;

/**
 * Root endpoint — confirms server is running and returns basic metrics.
 */
app.get("/", (req, res) => {
  requestCount++;
  res.json({
    status: "ok",
    service: "SEO-Guardian Backend",
    started_at: new Date(startTime).toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
    request_count: requestCount,
    lyzr_api_key_configured: !!LYZR_API_KEY,
  });
});

/**
 * Health endpoint — lightweight check; optionally pings Lyzr to confirm connectivity.
 */
app.get("/health", async (req, res) => {
  requestCount++;
  const health = {
    status: "ok",
    uptime_seconds: Math.floor(process.uptime()),
    started_at: new Date(startTime).toISOString(),
    request_count: requestCount,
    lyzr: { configured: !!LYZR_API_KEY },
  };

  if (!LYZR_API_KEY) {
    health.status = "degraded";
    health.lyzr.message = "LYZR_API_KEY not set";
    return res.status(200).json(health);
  }

  // Optional: quick connectivity test to Lyzr (short timeout so it doesn't hang)
  try {
    const resp = await axios.post(
      LYZR_API_URL,
      {
        user_id: "health-check",
        agent_id: "688377c03bf68ebc933cb332",
        session_id: `health-${Date.now()}`,
        message: "ping",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": LYZR_API_KEY,
        },
        timeout: 5000,
      }
    );

    health.lyzr.ok = true;
    health.lyzr.status = resp.status;
  } catch (err) {
    health.status = "degraded";
    health.lyzr.ok = false;
    health.lyzr.error = err.response?.data || err.message;
  }

  return res.status(200).json(health);
});

/**
 * Main audit endpoint — forwards the request to the Lyzr inference API.
 */
app.post("/api/audit", async (req, res) => {
  requestCount++;
  const {
    url,
    user_id = "conscioustyping@gmail.com",
    agent_id = "688377c03bf68ebc933cb332",
    session_id,
  } = req.body;

  if (!url)
    return res.status(400).json({ error: "Missing `url` in request body" });

  const sid = session_id || `${agent_id}-${Date.now()}`;
  const message = `Audit this website: ${url}`;

  try {
    const result = await axios.post(
      LYZR_API_URL,
      {
        user_id,
        agent_id,
        session_id: sid,
        message,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": LYZR_API_KEY,
        },
        timeout: 120000,
      }
    );

    // Forward the entire response from Lyzr to the client (transform if needed).
    return res.json(result.data);
  } catch (err) {
    console.error("Error calling Lyzr API:", err.response?.data || err.message);
    const status = err.response?.status || 500;
    return res
      .status(status)
      .json({
        error: "Lyzr API call failed",
        details: err.response?.data || err.message,
      });
  }
});


app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () =>
  console.log(`✅ Backend listening on http://localhost:${PORT}`)
);
