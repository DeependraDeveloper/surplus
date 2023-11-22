import mongoose from "mongoose";

const deviceInfoSchema = new mongoose.Schema(
  {
    deviceToken: {
      type: String,
      required: false,
      default: null,
    },
    deviceType: {
      type: String,
      required: false,
    },
    deviceName: {
      type: String,
      required: false,
    },
    deviceModel: {
      type: String,
      required: false,
    },
    deviceVersion: {
      type: String,
      required: false,
    },
    deviceManufacturer: {
      type: String,
      required: false,
    },
    deviceBrand: {
      type: String,
      required: false,
    },
    deviceIsPhysical: {
      type: Boolean,
      required: false,
    },
    ip: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const DeviceInfo = mongoose.model("DeviceInfo", deviceInfoSchema);

export default DeviceInfo;