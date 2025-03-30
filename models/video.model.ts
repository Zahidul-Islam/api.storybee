import { Schema, model } from "mongoose";

interface IVideo {
  createdBy: string;
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  tags: string[];

  category: string;

  isPublished: boolean;
  isFeatured: boolean;
  isDeleted: boolean;

  status: {
    type: String;
    required: false;
    enum: [
      "paused",
      "processing",
      "padding",
      "draft",
      "scheduled",
      "published",
      "failed",
      "failed-download",
      "failed-upload",
      "failed-register",
      "failed-publish",

      "removed-by-linkedin",
      "added-from-linkedin",

      "cancelled"
    ];
    default: "draft";
  };
  error: { type: String; required: false };
}

const VideoSchema = new Schema<IVideo>(
  {
    createdBy: { type: String, required: true },
    title: { type: String, required: false },
    description: { type: String, required: false },
    thumbnail: { type: String, required: false },
    url: { type: String, required: true },
    tags: { type: [String], required: false },
    category: { type: String, required: false },

    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },

    status: {
      type: String,
      required: false,
      enum: [
        "paused",
        "processing",
        "padding",
        "draft",
        "scheduled",
        "published",
        "failed",
        "failed-download",
        "failed-upload",
        "failed-register",
        "failed-publish",

        "removed-by-linkedin",
        "added-from-linkedin",

        "cancelled",
      ],
      default: "draft",
    },
    error: { type: String, required: false },
  },
  { timestamps: true }
);

const Video = model("Video", VideoSchema);
export default Video;
