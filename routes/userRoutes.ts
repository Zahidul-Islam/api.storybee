import { Hono } from "hono";
import { userController } from "../controllers";
import { isAdmin, protect } from "../middlewares";

const users = new Hono();

// Get All Users
users.get("/", protect, isAdmin, (c) => userController.getUsers(c));

// Get Single User
users.get("/:id", protect, (c) => userController.getUserById(c));

// Update User
users.put("/:id", protect, (c) => userController.updateUser(c));

// Update User
users.put("/:id/profile", protect, (c) => userController.updateUserProfile(c));

export default users;
