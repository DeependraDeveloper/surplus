import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import BadWordsFilter from "bad-words";
import User from "../models/userModel.js";
import Post from "../models/postModel.js";
const filter = new BadWordsFilter();

/// filter bad words
export const filterBadWords = async (req, res) => {
  try {
    const { text } = req.body;
    const hasOffensiveWords = filter.isProfane(text);

    console.log("hasOffensiveWords", hasOffensiveWords);

    if (hasOffensiveWords) {
      res.status(200).json({ containsOffensiveWords: true });
    } else {
      res.status(200).json({ containsOffensiveWords: false });
    }
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

// login as admin
export const loginAsAdmin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    console.log("login in api called", req.body);

    let findAdmin = await User.findOne({ phone });
    if (!findAdmin) throw new Error("Admin not found");

    if (!findAdmin.isAdmin) throw new Error("You are not admin");

    const validPassword = await bcrypt.compare(password, findAdmin.password);
    if (!validPassword) throw new Error("Invalid Password");

    let result = { ...findAdmin._doc };

    let userId = findAdmin._id;

    const token = jwt.sign(
      {
        id: userId,
      },
      process?.env?.JWT_SECRET_KEY ?? "daishdasih213231sa"
    );

    result.accessToken = token;

    console.log("result", result);

    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: err.message,
    });
  }
};

/// get all users
export const getAllUsers = async (req, res) => {
  try {
    console.log("get all users called");
    let users = await User.find({ isAdmin: false });
    if (!users) users = [];
    console.log("users", users.length);
    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};


/// get all posts
export const getAllPosts = async (req, res) => {
  try {
    let posts = await Post.find().populate("userId");

    if (!posts) posts = [];
    console.log("posts", posts.length);

    return res.status(200).json(posts);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

// bloc/unblock post
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.body;

    console.log("delete post api called from admin", req.body);

    let findPost = await Post.findById(postId);

    if (!findPost) throw new Error("Post not found");

    if (findPost.isDeleted == true) {
       await Post.findOneAndUpdate(
        { _id: postId },
        { isDeleted: false },
        { new: true }
      );

      return res.status(200).json({ message: "Post Unblocked successfully" });
    }

    await Post.findOneAndUpdate(
      { _id: postId },
      { isDeleted: true },
      { new: true }
    );

    return res.status(200).json({ message: "Post Blocked successfully" });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

// bloc/unblock user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;

    console.log("delete USER api called from admin", req.body);

    let findUser = await User.findById(userId);

    if (!findUser) throw new Error("Post not found");

    if (findUser.isDeleted == true) {
       await User.findOneAndUpdate(
        { _id: userId },
        { isDeleted: false },
        { new: true }
      );

      return res.status(200).json({ message: "user Unblocked successfully" });
    }

    await User.findOneAndUpdate(
      { _id: userId },
      { isDeleted: true },
      { new: true }
    );

    return res.status(200).json({ message: "User Blocked successfully" });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};