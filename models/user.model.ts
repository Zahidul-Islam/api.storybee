import { Document, Schema, model } from "mongoose";

interface IUser {
  avatar: string;
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  password: string;
  role: string;

  accessToken: string;
  //Auth fields
  isActive: boolean;
  otp: string;
  emailVerified: boolean;
  emailVerificationToken: string;
  emailVerificationTokenExpire: Date;
  resetPasswordToken: string;
  resetPasswordTokenExpire: Date;

  // Social Fields
  provider: "local" | "linkedin" | "google";
  googleId: string;
  linkedinId: string;
  tokens: {
    linkedin: {
      auth: {
        access_token: string;
        expires_in: number;
        expires_in_date: Date;
        scope: string;
        error: string;
      };
      management: {
        access_token: string;
        expires_in: number;
        expires_in_date: Date;
        refresh_token: string;
        refresh_token_expires_in: number;
        refresh_token_expires_in_date: Date;
        scope: string;
        error: string;
      };
    };
    canva: {
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
      expires_in_date: Date;
      scope: string;
    };
  };

  onboarding: object;
  lastLoginAt: Date;
}

export interface IUserDoc extends IUser, Document {
  mathPassword: (pass: string) => Promise<boolean>;
}

const userSchema = new Schema<IUserDoc>(
  {
    avatar: { type: String, required: false },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: false, unique: false },
    email: { type: String, required: false, unique: true },
    password: { type: String, required: false },
    role: {
      type: String,
      enum: ["user", "admin", "super"],
      default: "user",
    },

    accessToken: { type: String, required: false },
    // Auth fields
    isActive: { type: Boolean, default: false },
    otp: { type: String, required: false },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, required: false },
    emailVerificationTokenExpire: { type: Date, required: false },
    resetPasswordToken: { type: String, required: false },
    resetPasswordTokenExpire: { type: Date, required: false },

    // Social Fields
    provider: {
      type: String,
      enum: ["local", "linkedin", "google"],
      default: "local",
    },
    googleId: { type: String, required: false },
    linkedinId: { type: String, required: false },
    tokens: {
      linkedin: {
        auth: {
          access_token: { type: String },
          expires_in: { type: Number },
          expires_in_date: { type: Date },
          scope: { type: String },
          error: { type: String },
        },
        management: {
          access_token: { type: String },
          expires_in: { type: Number },
          expires_in_date: { type: Date },
          refresh_token: { type: String },
          refresh_token_expires_in: { type: Number },
          refresh_token_expires_in_date: { type: Date },
          scope: { type: String },
          error: { type: String },
        },
      },
      canva: {
        access_token: { type: String },
        refresh_token: { type: String },
        token_type: { type: String },
        expires_in: { type: Number },
        expires_in_date: { type: Date },
        scope: { type: String },
      },
    },

    onboarding: { type: Object, default: {} },
    lastLoginAt: { type: Date, required: false },
  },
  { timestamps: true }
);

// Match user entered password to hashed password in database
userSchema.methods.mathPassword = async function (enteredPassword: string) {
  return Bun.password.verifySync(enteredPassword, this.password);
};

// Hash password with Bun
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  // use bcrypt
  this.password = await Bun.password.hash(this.password, {
    algorithm: "bcrypt",
    cost: 4, // number between 4-31
  });
});

const User = model("User", userSchema);
export default User;
