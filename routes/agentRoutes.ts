import { Hono } from "hono";
import { agent } from "../controllers";

const agents = new Hono();

// generateVideo
agents.post("/scripts", (ctx) => agent.generateVideoScript(ctx));

export default agents;
