import express from "express";
const UserRouter = express.Router();

import {
  signUp,
  singIn,
  resetPassword,
  connect,
  getChats,
  getPostsNearBy,
  createPost,
  searchPost,
  getPosts,
  updatePost,
  updateUser,
  deletePost,
  blessPost,
  sendNotificationTest
} from "../controllers/userController.js";

/// User Routes
UserRouter.post("/signIn", singIn);
UserRouter.post("/signUp", signUp);
UserRouter.post("/reset/password", resetPassword);
UserRouter.post("/update/profile", updateUser);
UserRouter.get("/get/posts", getPosts);

UserRouter.post("/bless/post", blessPost);
UserRouter.post("/add/post", createPost);
UserRouter.post("/update/post", updatePost);
UserRouter.post("/delete/post", deletePost);
UserRouter.get("/posts", getPostsNearBy);
UserRouter.get("/search/post", searchPost);

UserRouter.post("/connect", connect);
UserRouter.get("/get/chats", getChats);

UserRouter.post("/send/notification", sendNotificationTest);

export default UserRouter;