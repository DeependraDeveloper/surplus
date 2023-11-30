import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    profilePic : {
      type: String,
      required: false,
      default:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQQP-WUs1TzGz2NLydG71XHCPqChIJe2A2Tg&usqp=CAU"
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
    range : {
      type: Number,
      required: false,
      default: 5,
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