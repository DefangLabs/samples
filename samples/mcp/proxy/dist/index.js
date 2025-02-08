"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
const mcpServiceUrl = process.env.MCP_SERVER_URL || "http://localhost:8000";
app.post("/forward", async (req, res) => {
    try {
        const response = await (0, node_fetch_1.default)(`${mcpServiceUrl}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
        });
        const data = await response.json();
        res.json(data);
    }
    catch (error) {
        console.error("Error forwarding request:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
app.listen(4000, () => {
    console.log("Proxy server running on port 4000");
});
