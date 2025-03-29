import { Context } from "hono";
import { genToken } from "../utils";

/**
 * @api {get} /users Get All Users
 * @apiGroup Users
 * @access Private
 */
export const generateVideo = async (c: Context) => {
  console.log("Generating video...");

  return c.json({ status: "success" });
};
