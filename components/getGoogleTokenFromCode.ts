const getGoogleTokenFromCode = async (code: string) => {
  const response = (await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${process.env.FRONTEND_URL}/auth/google`,
      code: code,
      grant_type: "authorization_code",
    }),
  }).then((res) => res.json())) as any;

  if ("error" in response) {
    // throw new HTTPException(400, { message: response.error_description });

    throw new Error(response.error_description);
  }

  if ("access_token" in response) {
    const accessToken = response.access_token;

    const user = (await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    }).then((res) => res.json())) as any;

    if ("error" in user) {
      //   throw new HTTPException(400, { message: response.error?.message });

      throw new Error(response.error.message);
    }

    return user;
  }
};

export default getGoogleTokenFromCode;
