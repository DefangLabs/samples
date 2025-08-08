import express from "express";
import { getAgentOutputAsString } from "./agent.mts";
import path from "path";
import rateLimit from "express-rate-limit";

const app = express();

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));
app.use(limiter);

app.post("/agent", async (req, res) => {
  const input = req.body.input;
  try {
    const output = await getAgentOutputAsString(input);
    res.json({ output });
  } catch (error) {
    console.error('Error processing agent request:', error);
    res.status(500).json({ 
      output: "Sorry, there was an error processing your request. The LLM service might be unavailable or misconfigured." 
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

app.listen(3000, () => console.log("Agent server listening on APP PORT 3000"));
