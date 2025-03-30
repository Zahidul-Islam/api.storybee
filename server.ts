import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
//
import connectDB from "./config/db";
import { Users } from "./routes";
import { Agent } from "./routes";

import { errorHandler, notFound } from "./middlewares";

// Initialize the Hono app
const app = new Hono().basePath("/api/v1");

// Config MongoDB
// connectDB();

// Initialize middlewares
app.use("*", logger(), prettyJSON());

// Cors
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// Home Route
app.get("/", (c) => c.text("live!"));

// User Routes
app.route("/users", Users);
app.route("/agents", Agent);

// Error Handler
app.onError((err, c) => {
  const error = errorHandler(c);
  return error;
});

// Not Found Handler
app.notFound((c) => {
  const error = notFound(c);
  return error;
});

app.onError((err, c) => {
  console.error(err);
  if (err instanceof HTTPException) {
    // Get the custom response
    return err.getResponse();
  }
  // Return a generic error response if no specific handling is done
  return c.text("An unexpected error occurred", 500);
});

const port = Bun.env.PORT || 8000;

export default {
  port,
  fetch: app.fetch,
};
