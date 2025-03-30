import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { cors } from "hono/cors";
import { showRoutes } from "hono/dev";

import connectDB from "./config/db";
import { Users, Auth, Agent } from "./routes";
import { errorHandler, notFound } from "./middlewares";

// Initialize the Hono app
const app = new Hono().basePath("/api/v1");

// Initialize middlewares
app.use("*", logger(), prettyJSON());

// Enable CORS
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// Home Route
app.get("/", (c) => c.text("live!"));

// API Routes
app.route("/auth", Auth);
app.route("/users", Users);
app.route("/agents", Agent);

// Error Handling
app.onError((err, c) => errorHandler(c));
app.notFound((c) => notFound(c));

// **Export Default at the Top Level**
const port = Bun.env.PORT || 8000;
export default {
  port,
  fetch: app.fetch,
  idleTimeout: 255,
};

// **Start Server After Database is Connected**
const startServer = async () => {
  try {
    await connectDB(); // Ensure DB connection before starting the server
    console.log("✅ MongoDB connected!");

    console.log(`🚀 Server running on http://localhost:${port}`);

    showRoutes(app);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1); // Exit process if server fails to start
  }
};

// **Start the app**
startServer();

// import { Hono } from "hono";
// import { logger } from "hono/logger";
// import { prettyJSON } from "hono/pretty-json";
// import { cors } from "hono/cors";
// import { HTTPException } from "hono/http-exception";
// //
// import connectDB from "./config/db";
// import { Users, Agent, Auth } from "./routes";

// import { errorHandler, notFound } from "./middlewares";

// // Initialize the Hono app
// const app = new Hono().basePath("/api/v1");

// // Config MongoDB
// // connectDB();

// // Initialize middlewares
// app.use("*", logger(), prettyJSON());

// // Cors
// app.use(
//   "*",
//   cors({
//     origin: "*",
//     allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   })
// );

// // Home Route
// app.get("/", (c) => c.text("live!"));

// // User Routes
// app.route("/auth", Auth);
// app.route("/users", Users);
// app.route("/agents", Agent);

// // Error Handler
// app.onError((err, c) => {
//   const error = errorHandler(c);
//   return error;
// });

// // Not Found Handler
// app.notFound((c) => {
//   const error = notFound(c);
//   return error;
// });

// app.onError((err, c) => {
//   console.error(err);
//   if (err instanceof HTTPException) {
//     // Get the custom response
//     return err.getResponse();
//   }
//   // Return a generic error response if no specific handling is done
//   return c.text("An unexpected error occurred", 500);
// });

// const port = Bun.env.PORT || 8000;

// export default {
//   port,
//   fetch: app.fetch,
// };
