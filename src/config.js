import dotenv from "dotenv";
dotenv.config();

// packages
import express from "express";
import mongoose from "mongoose";
import { Server } from "socket.io";
import http from "http";
import multer from "multer";
import cors from "cors";

// routes
import UserRouter from "./routes/userRoute.js";
import AdminRouter from "./routes/adminRoute.js";

// models
import Chat from "./models/chatModel.js";
import User from "./models/userModel.js";
import DeviceInfo from "./models/deviceInfoModel.js";

// helpers
import { s3Uploader } from "./helpers/aws.js";
import { sendNotification } from "./helpers/pushNotification.js";


const port = process?.env?.PORT ?? 5000;
const dbUrl =
  process?.env?.DB_URL ??
  "mongodb+srv://Deependra1999:Z1ZWVlMvcAFQsu2u@cluster0.4nkid.mongodb.net/Surplus";

export const app = express();

export async function startServer() {
  mongoose.set("strictQuery", false);

  const httpServer = http.createServer(app);

  const option = { cors: { origin: "*" }, maxHttpBufferSize: 1e8 };

  // create socket server
  const io = new Server(httpServer, option); // Pass httpServer instance to socket.io

  // socket.io
  io.on("connect", (socket) => {
    socket.on("message", async ({ chatId, sender }) => {
      try {
        console.log(`User joined chat: ${chatId} ${sender}`);
        // Join the chat room based on the provided chatId
        socket.join(chatId);

        // Retrieve the chat document based on the chatId
        const foundChat = await Chat.findById(chatId);
        // console.log(foundChat);

        if (!foundChat) {
          // Handle if the chat document doesn't exist
          console.log("Chat document not found");
          return;
        }

        // Emit existing messages to the user who joined the chat
        io.to(socket.id).emit("message", foundChat.messages);
        console.log(`Existing messages emitted to user in chat: ${chatId}`);
      } catch (error) {
        console.log("Error joining chat:", error);
      }
    });

    socket.on("sendMessage", async ({ chatId, message, sender }) => {
      try {
        console.log(`User sent message in chat ${chatId}: ${message} ${sender}`);

        /// check whether the content is string message or file as Uint8 from client

        let content;
        if (typeof message === "string") {
          content = message;
        } else {
          let listimage = [];
          for (let msg of message) {
            let converted_image = Buffer.from(msg, "base64");
            // console.log("convered image",converted_image);
            let url = await s3Uploader(
              converted_image,
              `surplus/${chatId}${Date.now().toString()}.png`,
              "socket"
            );
            // console.log("url",url);
            listimage.push(url.toString());
          }
          content = listimage.join(", ");
          // console.log("content",content);
        }

        // Update the chat document with the new message
        const newMessage = {
          sender,
          content: content,
          timestamp: Date.now(),
        };

        let updatedChat = await Chat.findByIdAndUpdate(
          chatId,
          { $push: { messages: newMessage } },
          { new: true }
        );

        let messages = updatedChat?.messages ?? [];

        // Emit the new message to all users in the chat room
        io.to(chatId).emit("message", messages);

        // here we will send notification to the user
        // check to whom we have to send notification

        let receiver = updatedChat?.messages?.find(
          (msg) => msg?.sender?.toString() !== sender
        );

        let sendingUser;

        if (receiver) {
          sendingUser = receiver?.sender?.toString() ?? "";
        } else {
          sendingUser = updatedChat.to.toString() ?? "";
        }

        console.log("sending user", sendingUser)

        if (sendingUser) {
          let findUser =
            await User.findById(sendingUser);

          let devices = findUser?.devices ?? [];
            // console.log("devices", devices);

          let lastDevice = devices[devices.length - 1];
          // console.log("last device", lastDevice);
          let findDevice = (await DeviceInfo.findById(lastDevice)) ?? {};
        // console.log("find device", findDevice);
          let token = findDevice?.deviceToken ?? "";
          // console.log("token", token);

          let title = "New Message";
          let body = "You have a new message";
          let type = "chat";

          await sendNotification(token, title, body, type)
            .then((result) =>
              console.log("Chat Notification was sent from socekt!", result)
            )
            .catch((err) =>
              console.log("Chat Notification was sent from socekt", err)
            );
        }

        console.log(`New message emitted to chat ${chatId}`);
      } catch (error) {
        console.log("Error sending message:", error);
      }
    });

    socket.on("disconnect", () => console.log("Disconnected from socket"));
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(multer().any());
  app.use(cors());

  /// log all requests
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} ${req.ip}`);
    next();
  });

  app.get("/health", (req, res) => {
    res.send("ok");
  });

  app.use("/api/v1/user", UserRouter);
  app.use("/api/v1/admin", AdminRouter);

  await mongoose
    .connect(dbUrl)
    .then(() => console.log("Connected to DB"))
    .catch((err) => console.log(err));

  httpServer.listen(port, () => console.log(`Server is running...${port}`));
}
