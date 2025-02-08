import cors from "cors";
import express, { Request, Response } from "express";

const app = express();

// Use CORS with dynamic origin configuration
const allowedOrigins = [process.env.CORS_ALLOW];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true); // Allow the request
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(express.json());

const mcpServiceUrl = process.env.MCP_SERVER_URL || "http://localhost:8000";

app.post("/forward", async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${mcpServiceUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error forwarding request:", error);
    res
      .status(500)
      .json({ error: `Internal server error url: ${mcpServiceUrl}: ${error}` });
  }
});

app.listen(4000, () => {
  console.log("Proxy server running on port 4000");
});
