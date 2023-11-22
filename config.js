import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import { Server } from "socket.io";
import http from "http";
import multer from "multer";
import UserRouter from "./routes/userRoute.js";
import Chat from "./models/chatModel.js";

const port = process?.env?.PORT ?? 3030;
const dbUrl = process?.env?.DB_URL ?? "mongodb+srv://Deependra1999:Z1ZWVlMvcAFQsu2u@cluster0.4nkid.mongodb.net/Surplus";
const app = express();

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
        console.log(foundChat);

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
        console.log(`User sent message in chat ${chatId}: ${message}`);
        // Update the chat document with the new message
        const newMessage = {
          sender,
          content: message,
          timestamp: Date.now(),
        };

        let updatedChat = await Chat.findByIdAndUpdate(
          chatId,
          { $push: { messages: newMessage } },
          { new: true }
        );


        let messages = updatedChat.messages;

        // Emit the new message to all users in the chat room
        io.to(chatId).emit("message", messages);
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

  /// log all requests
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} ${req.ip}`);
    next();
  });

  app.use("/api/v1/user", UserRouter);

  await mongoose
    .connect(dbUrl)
    .then(() => console.log("Connected to DB"))
    .catch((err) => console.log(err));

  httpServer.listen(port, () => console.log(`Server is running...${port}`));
}
