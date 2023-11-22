import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    blessedBy : {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
    },
    description: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      required: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    location: {
      type: { type: String, required: true },
      coordinates: [],
  },
  },
  { timestamps: true, versionKey: false }
);

postSchema.index({ location: "2dsphere" });
const Post = mongoose.model("Post", postSchema);

export default Post;