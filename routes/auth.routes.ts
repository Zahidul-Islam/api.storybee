import { Hono } from "hono";
import { authController } from "../controllers";
import { protect } from "../middlewares";

const auth = new Hono();

// Google Login
auth.get("/google", (c) => authController.googleLogin(c));

// Google Callback
auth.post("/google/callback", (c) => authController.googleCallback(c));

// // Logout
// auth.get("/logout", (c) => localAuthController.logoutUser(c));

export default auth;
