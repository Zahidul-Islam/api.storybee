import { Context, Next } from "hono";
import { Jwt } from "hono/utils/jwt";
//
import { User } from "../models";

// Protect Route for Authenticated Users
export const protect = async (c: Context, next: Next) => {
  let token;

  if (
    c.req.header("Authorization") &&
    c.req.header("Authorization")?.startsWith("Bearer")
  ) {
    try {
      token = c.req.header("Authorization")?.replace(/Bearer\s+/i, "");
      if (!token) {
        return c.json({ message: "Not authorized to access this route" });
      }

      const { id } = await Jwt.verify(token, Bun.env.JWT_SECRET || "");
      const user = await User.findById(id).select("-password");
      c.set("user", user);
      c.set("userId", user?._id);

      await next();
    } catch (err) {
      throw new Error("Invalid token! You are not authorized!");
    }
  }

  if (!token) {
    throw new Error("Not authorized! No token found!");
  }
};

// Check if user is admin
export const isAdmin = async (c: Context, next: Next) => {
  const user = c.get("user");

  if (user && ["admin", "super"].includes(user?.role)) {
    await next();
  } else {
    c.status(401);
    throw new Error("Not authorized as an admin!");
  }
};

// Check if user is super
export const isSuper = async (c: Context, next: Next) => {
  const user = c.get("user");

  if (user && user?.role === "super") {
    await next();
  } else {
    c.status(401);
    throw new Error("Not authorized as an admin!");
  }
};
