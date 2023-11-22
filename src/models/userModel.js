import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    profilePic : {
      type: String,
      required: false,
      default:""
    },
    blessed: {
      type: Number,
      default: 0,
    },
    name: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
    profilePic: {
      type: String,
      required: false,
    },
    password : {
      type: String,
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
    devices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "DeviceInfo",
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

userSchema.index({ location: "2dsphere" });
const User = mongoose.model("User", userSchema);

export default User;