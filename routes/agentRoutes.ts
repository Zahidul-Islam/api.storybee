import { Hono } from "hono";
import { agent } from "../controllers";
import { protect } from "../middlewares";

const agents = new Hono();

// generateVideo
agents.post("/scripts", protect, (ctx) => agent.generateVideoScript(ctx));

// get all videos
agents.get("/videos", protect, (ctx) => agent.getAllVideos(ctx));

// get video by id
agents.get("/videos/:id", protect, (ctx) => agent.getVideoById(ctx));

export default agents;
