import dotenv from "dotenv";
dotenv.config();

// Models
import Post from "../models/postModel.js";
import DeviceInfo from "../models/deviceInfoModel.js";
import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";

// Helpers Functions
import { s3Uploader } from "../helpers/aws.js";
import { sendNotification } from "../helpers/pushNotification.js";

// Packages
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

//! USER APIS
/// register a new user
export const signUp = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      lat,
      long,
      password,
      deviceToken,
      deviceType,
      deviceName,
      deviceModel,
      deviceVersion,
      deviceManufacturer,
      deviceBrand,
      deviceIsPhysical,
      ip,
    } = req.body;

    console.log("sign up api called", req.body);

    let findAlreadyUser = await User.findOne({ phone });

    if (findAlreadyUser) throw new Error("Phone Already Registered!!..");

    const salt = 10;

    const hashedPassword = await bcrypt.hash(password, salt);

    let device = await DeviceInfo.create({
      deviceToken,
      deviceType,
      deviceName,
      deviceModel,
      deviceVersion,
      deviceManufacturer,
      deviceBrand,
      deviceIsPhysical,
      ip,
    });

    let deviceID = device._id;

    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      location: {
        type: "Point",
        coordinates: [parseFloat(long), parseFloat(lat)],
      },
      devices: [deviceID],
    });

    const newUser = await User.create(user);

    // create a token

    const token = jwt.sign(
      {
        id: newUser._id,
      },
      process?.env?.JWT_SECRET_KEY ?? "daishdasih213231sa"
    );

    let createdUser = { ...newUser._doc };
    createdUser.access_token = token;

    res.status(201).json(createdUser);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

/// login a user
export const singIn = async (req, res) => {
  try {
    const {
      phone,
      password,
      lat,
      long,
      deviceToken,
      deviceType,
      deviceName,
      deviceModel,
      deviceVersion,
      deviceManufacturer,
      deviceBrand,
      deviceIsPhysical,
      ip,
    } = req.body;

    console.log("sign in api called", req.body);

    let findUser = await User.findOne({ phone });
    if (!findUser) throw new Error("User not found");

    const validPassword = await bcrypt.compare(password, findUser.password);
    if (!validPassword) throw new Error("Invalid Password");

    let result = { ...findUser._doc };

    let userId = findUser._id;

    let device = await DeviceInfo.create({
      deviceToken,
      deviceType,
      deviceName,
      deviceModel,
      deviceVersion,
      deviceManufacturer,
      deviceBrand,
      deviceIsPhysical,
      ip,
    });

    let deviceID = device._id;

    await User.findOneAndUpdate(
      { _id: userId },
      {
        location: {
          type: "Point",
          coordinates: [parseFloat(long), parseFloat(lat)],
        },
        $addToSet: { devices: deviceID },
      },
      { new: true }
    );

    const token = jwt.sign(
      {
        id: userId,
      },
      process?.env?.JWT_SECRET_KEY ?? "daishdasih213231sa"
    );

    let userPosts = await Post.find({ userId: userId });

    result.access_token = token;
    result.userPosts = userPosts;

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

/// reset password
export const resetPassword = async (req, res) => {
  try {
    const { phone, reEnteredPassword, password } = req.body;

    console.log("reset password  api called", req.body);

    let findAlreadyUser = await User.findOne({ phone });

    if (!findAlreadyUser)
      throw new Error("User Not Found With This Phone Number!!..");

    if (reEnteredPassword != password)
      throw new Error("Password Not Matched!!..");

    const salt = 10;

    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.findOneAndUpdate(
      { phone },
      { password: hashedPassword },
      { new: true }
    );

    // create a token

    const token = jwt.sign(
      {
        id: newUser._id,
      },
      process?.env?.JWT_SECRET_KEY ?? "daishdasih213231sa"
    );

    let createdUser = { ...newUser._doc };
    createdUser.access_token = token;

    res.status(200).json(createdUser);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

/// update a user
export const updateUser = async (req, res) => {
  try {
    const { name, email, phone, profilePic, userId } = req.body;

    console.log("update user api called", req.body);

    let findUser = await User.findById(userId);

    if (!findUser) throw new Error("User not found");

    if (findUser.isDeleted) throw new Error("User is blocked");

    let file = req.files;

    console.log("update user file", file);

    let uploadImages = [];

    if (file) {
      for (let i = 0; i < file.length; i++) {
        const data = file[i];
        const result = await s3Uploader(
          data,
          `surplus/${userId}${Date.now().toString()}`,
          "api"
        );
        uploadImages.push(result);
      }
    }

    let uploadResult = await Promise.all(uploadImages);

    if (file.length != 0) {
      var updateData = {
        name,
        email,
        phone,
        profilePic: uploadResult[0],
      };
    } else {
      var updateData = {
        name,
        email,
        phone,
      };
    }

    const user = await User.findByIdAndUpdate({ _id: userId }, updateData, {
      new: true,
    });

    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

//! CHAT APIS
/// connect two users
export const connect = async (req, res) => {
  try {
    const { from, post, to } = req.body;

    let findUser = await User.findById(from);

    if (!findUser) throw new Error("User not found");

    if (findUser.isDeleted) throw new Error("User is blocked");

    console.log("connect api called", req.body);

    let findChat = await Chat.findOne({ from, post, to });

    if (findChat) {
      console.log("fouind chat");
      return res.status(201).json({
        message: "Chat Initiated..!",
      });
    }

    let findChatAgain = await Chat.findOne({
      from: {
        $in: [from, to],
      },
      to: {
        $in: [from, to],
      },
    });

    if (findChatAgain) {
      console.log("fouind chat again");

      return res.status(201).json({
        message: "Chat Initiated..!",
      });
    }

    let createChat = await Chat.create({
      from,
      post,
      to,
    });

    let findTo = (await User.findById(to).select("devices")) ?? [];
    let lastDevice = findTo?.devices[findTo?.devices?.length - 1];
    let findDevice = (await DeviceInfo.findById(lastDevice)) ?? {};
    let token = findDevice?.deviceToken ?? "";
    let title = "New Message";
    let body = "You have received a new message";
    let type = "chat";

    await sendNotification(token, title, body, type)
      .then((result) => console.log("New Message notification sent", result))
      .catch((err) =>
        console.log("Push Deliver notification to store Error", err)
      );

    res.status(201).json({
      message: "Chat Initiated..!",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: err.message,
    });
  }
};

/// get chats of a user
export const getChats = async (req, res) => {
  try {
    const { user } = req.query;

    let findUser = await User.findById(user);

    if (!findUser) throw new Error("User not found");

    if (findUser.isDeleted) throw new Error("User is blocked");

    console.log("get chats api called", req.query);

    let chats = await Chat.find({ $or: [{ from: user }, { to: user }] })
      .populate("post from to")
      .populate({
        path: "post",
        populate: {
          path: "userId",
          model: "User",
        },
      });

    // console.log("chats", chats);

    res.status(200).json(chats);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

//! POST APIS
// create posts
export const createPost = async (req, res) => {
  try {
    let { userId, title, description, lat, long } = req.body;

    console.log("create post api called", req.body);

    let findUser = await User.findById(userId);

    if (!findUser) throw new Error("User not found");

    if (findUser.isDeleted) throw new Error("User is blocked");

    if (!userId || !title || !description)
      throw new Error("All fields are required!");

    if (lat == 0 || long == 0) {
      let findUser = await User.findById(userId);
      lat = findUser?.location?.coordinates[1] ?? 0.0;
      long = findUser?.location?.coordinates[2] ?? 0.0;
    }

    let file = req.files;
    // console.log(file);
    let pics = [];

    for (let i = 0; i < file.length; i++) {
      const data = file[i];
      const result = await s3Uploader(
        data,
        `surplus/${userId}${Date.now().toString()}.png`,
        "api"
      );
      // console.log(result);
      pics.push(result);
    }

    let uploadResult = await Promise.all(pics);

    let newPost = await Post.create({
      userId,
      title,
      description,
      images: uploadResult,
      location: {
        type: "Point",
        coordinates: [parseFloat(long), parseFloat(lat)],
      },
    });

    let findNearByUsers =
      (await User.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [parseFloat(long), parseFloat(lat)],
            },
            key: "location",
            maxDistance: 4220,
            distanceField: "dist.calculated",
            spherical: true,
          },
        },
      ])) ?? [];

    let devices = [];

    for (let user of findNearByUsers) {
      let userDevices = user.devices ?? [];
      let lastDevice = userDevices[userDevices.length - 1];
      if (lastDevice) devices.push(lastDevice);
    }

    for (let device of devices) {
      let findDevice = (await DeviceInfo.findById(device)) ?? {};
      let token = findDevice?.deviceToken;
      let title = "New Blessing";
      let body = "New blessing posted near you";
      let type = "post";
      await sendNotification(token, title, body, type)
        .then((result) => console.log("New Blessing notification sent", result))
        .catch((err) =>
          console.log("Push Deliver notification to store Error", err)
        );
    }

    return res.status(201).json(newPost);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

// get users posts
export const getPosts = async (req, res) => {
  try {
    const { userId } = req.query;

    let findUser = await User.findById(userId);

    if (!findUser) throw new Error("User not found");

    if (findUser.isDeleted) throw new Error("User is blocked");

    console.log("get posts api called", req.query);

    let posts = await Post.find({ isDeleted: false, userId: userId }).sort({
      createdAt: -1,
    });

    // console.log("posts", posts);

    return res.status(200).json({ posts });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

// update post
export const updatePost = async (req, res) => {
  try {
    const { title, description, images, postId } = req.body;

    let findPost = await Post.findById(postId);

    let findUser = await User.findById(findPost.userId);

    if (!findUser) throw new Error("User not found");

    if (findUser.isDeleted) throw new Error("User is blocked");

    console.log("update post api called", req.body);
    let file = req.files;

    console.log("update post file", file);
    let pics = [];

    for (let i = 0; i < file.length; i++) {
      const data = file[i];
      const result = await s3Uploader(
        data,
        `surplus/${postId}${Date.now().toString()}`,
        "api"
      );
      pics.push(result);
    }

    if (file.length != 0) {
      let uploadResult = await Promise.all(pics);
      var updateData = {
        title,
        description,
        images: uploadResult,
      };
    } else {
      var updateData = {
        title,
        description,
      };
    }

    let post = await Post.findByIdAndUpdate({ _id: postId }, updateData, {
      new: true,
    });

    return res.status(200).json(post);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

// delete post
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.body;

    console.log("delete post api called", req.body);

    let findPost = await Post.findById(postId);

    let findUser = await User.findById(findPost.userId);

    if (!findUser) throw new Error("User not found");

    if (findUser.isDeleted) throw new Error("User is blocked");

    let post = await Post.findOneAndUpdate(
      { _id: postId },
      { isDeleted: true },
      { new: true }
    );
    if (!post) throw new Error("Post not found");

    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

/// get all nearby posts
export const getPostsNearBy = async (req, res) => {
  try {
    let lat = req.query.lat ?? 0.0;
    let long = req.query.long ?? 0.0;
    let userId = req.query.userId ?? "";
    let range = req.query.range ?? 5000;

    if (range) {
      let updateUserRange = await User.findOneAndUpdate(
        { _id: userId },
        { range: range },
        { new: true }
      );
    }

    range = range * 1000;

    console.log("get near by posts api called", req.query, range);

    if (parseFloat(lat) === 0.0 && parseFloat(long) === 0.0) {
      // Your logic here to handle lat and long being 0.0
      console.log(
        "Bonuse called, changing the lat long--------------------------------"
      );
      let findUser = await User.findById(userId);
      lat = findUser?.location?.coordinates[1] ?? 0.0;
      long = findUser?.location?.coordinates[0] ?? 0.0;

      console.log("lat long overrinden bonus", lat, long);
    }

    let posts = await Post.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(long), parseFloat(lat)],
          },
          key: "location",
          maxDistance: range,
          distanceField: "dist.calculated",
          spherical: true,
        },
      },
    ]);

    posts = posts.filter(
      (post) => post.userId != userId && post.isDeleted == false
    );

    return res.status(200).json(posts);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

/// search post
export const searchPost = async (req, res) => {
  try {
    let name = req.query.name ?? "";
    let userId = req.query.userId;
    let lat = req.query.lat ?? 0.0;
    let long = req.query.long ?? 0.0;

    console.log("search post api called", req.query);

    let findUser = await User.findById(userId);

    if (!findUser) throw new Error("User not found");

    if (findUser.isDeleted) throw new Error("User is blocked");

    if (
      name?.length == 0 ||
      name == "" ||
      name == null ||
      name == undefined ||
      name == "undefined" ||
      name == "null"
    ) {
      return res.status(200).json([]);
    }

    if (parseFloat(lat) === 0.0 && parseFloat(long) === 0.0) {
      // Your logic here to handle lat and long being 0.0
      console.log("Bonuse called, changing the lat long");
      let findUser = await User.findById(userId);
      lat = findUser?.location?.coordinates[1] ?? 0.0;
      long = findUser?.location?.coordinates[0] ?? 0.0;
    }

    let posts = await Post.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(long), parseFloat(lat)],
          },
          key: "location",
          maxDistance: findUser?.range * 1000 ?? 5000,
          distanceField: "dist.calculated",
          spherical: true,
        },
      },
      {
        $match: {
          title: {
            $regex: name,
            $options: "i",
          },
        },
      },
    ]);

    // console.log("posts", posts);

    posts = posts.filter((post) => post.userId != userId);

    return res.status(200).json(posts);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

//! FEATURE APIS FOR POST
/// Bless or Unbless a post
export const blessPost = async (req, res) => {
  try {
    const { postId, userId } = req.body;

    console.log("bless post api called", req.body);

    let findUser = await User.findById(userId);

    if (!findUser) throw new Error("User not found");

    if (findUser.isDeleted) throw new Error("User is blocked");

    let findPost = await Post.findById(postId);

    if (!findPost) throw new Error("Post not found");

    let blessedBy = findPost.blessedBy;

    if (blessedBy.includes(userId)) {
      console.log("Unblessed by user");
      await Post.findOneAndUpdate(
        { _id: postId },
        { $pull: { blessedBy: userId } },
        { new: true }
      );

      return res.status(200).json({ message: "Blessed removed successfully" });
    }

    console.log("Blessed by user");
    await Post.findOneAndUpdate(
      { _id: postId },
      { $addToSet: { blessedBy: userId } },
      { new: true }
    );

    let toUser = await User.findOne({ _id: findPost.userId });

    let devices = toUser?.devices ?? [];

    let lastDevice = devices[devices.length - 1];

    let findDevice = (await DeviceInfo.findById(lastDevice)) ?? {};

    let token = findDevice?.deviceToken ?? "";
    console.log("token", token);

    let title = "Blessed";
    let body = "You have been blessed by a user";
    let type = "bless";

    await sendNotification(token, title, body, type)
      .then((result) => console.log("User blessed notification sent !", result))
      .catch((err) =>
        console.log("Push Deliver notification to store Error", err)
      );
    return res.status(200).json({ message: "Blessed successfully" });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

// get post by id
export const getPost = async (req, res) => {
  try {
    let post = await Post.findById(req.query.postId);

    console.log("get post api called", req.query.postId);

    if (!post) throw new Error("Post not found");

    return res.status(200).json(post);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

// get user by id
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.query;

    console.log("get user by id api called", req.query);

    let user = await User.findById(userId);

    if (!user) throw new Error("User not found");

    if (user.isDeleted) throw new Error("User is blocked");

    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};
