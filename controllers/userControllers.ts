import { Context } from "hono";
import { User } from "../models";

/**
 * @api {get} /users Get All Users
 * @apiGroup Users
 * @access Private
 */
export const getUsers = async (c: Context) => {
  const users = await User.find();

  return c.json({
    success: true,
    data: users,
    message: "All users fetched successfully",
  });
};

/**
 * @api {get} /users/:id Get User By Id
 * @apiGroup Users
 * @access Private
 */

export const getUserById = async (ctx: Context | any) => {
  const userId = await ctx.get("userId").toString();

  const id = await ctx.req.param("id");

  console.log("User ID: ", userId);
  console.log("ID: ", id);

  if (userId !== id) {
    return ctx.status(401).json({
      success: false,
      message: "Unauthorized access to user account",
    });
  }

  try {
    // const userProfile = await UserProfile.findOne({ createdBy: id });
    const user = await User.findById(id);

    if (!user) {
      return ctx.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return ctx.status(403).json({
        success: false,
        message: "User account is disabled",
      });
    }

    return ctx.json({
      success: true,
      data: user,
      message: "User profile fetched successfully",
    });
  } catch (error: any) {
    return ctx.status(error.status).json({
      success: false,
      data: error,
      message: "User not found",
    });
  }
};

/**
 * @api {put} /users Update User
 * @apiGroup Users
 * @access Private
 */
export const updateUser = async (c: Context | any) => {
  // const id = await c.req.param("id");

  const userId = await c.get("userId");
  const body = await c.req.json();

  delete body.tokens;
  delete body._id;
  delete body.createdAt;
  delete body.updatedAt;

  const user = await User.findByIdAndUpdate(userId, body, {
    new: true,
    runValidators: true,
  });

  return c.json({
    success: true,
    data: user,
    message: "User updated successfully",
  });
};
