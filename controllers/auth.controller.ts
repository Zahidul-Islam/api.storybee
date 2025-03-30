import { Context } from "hono";
import { User } from "../models";

import { generateAccessToken } from "../utils/auth.util";
import getGoogleTokenFromCode from "../components/getGoogleTokenFromCode";

/**
 * @api {post} /auth/linkedin Login with Linkedin
 * @apiGroup Users
 * @access Public
 */

// const scopes = ["openid", "profile", "w_member_social", "email"];
// const state = process.env.NODE_ENV;
export const googleLogin = async (ctx: Context) => {
  const response_type = "code";
  const client_id = process.env.GOOGLE_CLIENT_ID;
  const scope = ["profile", "email"].join(" ");
  const redirect_uri = `${process.env.FRONTEND_URL}/auth/google`;
  const include_granted_scopes = true;

  return ctx.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?response_type=${response_type}&client_id=${client_id}&scope=${scope}&redirect_uri=${redirect_uri}&include_granted_scopes=${include_granted_scopes}`
  );
};

/**
 * @api {get} /auth/Google/callback Google Callback
 * @apiGroup Users
 * @access Public
 */
export const googleCallback = async (c: Context) => {
  const code = c.req.query("code") || (await c.req.json()).code;

  console.log("googleCallback : ", code);

  try {
    const {
      id,
      email,
      verified_email,
      name,
      given_name,
      family_name,
      picture,
    } = await getGoogleTokenFromCode(code as string);
    console.log("googleCallback : ", id, email, verified_email, name);

    // 1) Check if user exists
    let user = (await User.findOne({ email })) as any;

    console.log("googleCallback : ", user);

    if (!user) {
      // 2) Create new user
      user = await User.create({
        firstName: given_name,
        lastName: family_name,
        username: id,
        email,
        emailVerified: verified_email,

        isActive: true,
        provider: "google",
        googleId: id,
      });
    }

    if (!user.isActive) {
      return c.json(
        {
          status: 403,
          success: false,
          message: "User account is disabled",
        },
        403
      );
    }

    user.avatar = picture;
    await user.save();

    // 3) Generate access token
    const accessToken = await generateAccessToken(user);

    // 5) Return final response
    return c.json(
      {
        status: 200,
        success: true,
        data: user,
        token: accessToken,
      },
      200
    );
  } catch (err: any) {
    console.error("Google Callback Error:", err);
    return c.json(
      {
        status: err?.status || 500,
        success: false,
        message: err?.message || "Google callback failed",
      },
      err?.status || 500
    );
  }
};
