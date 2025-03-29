import { Hono } from "hono";
import { agent } from "../controllers";

const agents = new Hono();

// generateVideo
agents.post("/", (ctx) => agent.generateVideo(ctx));

export default agents;
