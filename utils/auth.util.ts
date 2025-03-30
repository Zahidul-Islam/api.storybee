import { sign } from "hono/jwt";
import { deriveEncryptionKeyFromPassword } from "./crypto.util";

const salt = process.env.JWT_SECRET as string;

export const generateAccessToken = async (user: any) => {
  const encryptionKey = deriveEncryptionKeyFromPassword(
    user?.password || user?._id?.toString(),
    salt
  );
  const payload = {
    id: user._id,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Token expires in 30d
    encKey: encryptionKey.toString("hex"),
  };

  return await sign(payload, process.env.JWT_SECRET!);
};

export const generateOtpCode = () => {
  const hasher = new Bun.CryptoHasher("sha256");
  const randomNumber = Math.floor(Math.random() * 900000) + 100000;
  const hash = hasher.update(randomNumber.toString()).digest("hex");
  return {
    resetToken: hash,
    otp: hash.toString().substring(0, 6).toLocaleUpperCase(),
  };
};

export function convertToQueryParams(params: { [key: string]: any }): string {
  const elements = Object.keys(params);

  elements.forEach((element) => {
    if (params[element] === undefined) {
      delete params[element];
    }
  });

  return new URLSearchParams(params).toString();
}

export const hashedPassword = async (password: string) => {
  return await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 8,
  });
};
