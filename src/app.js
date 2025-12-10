import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();

// Middleware
app.use(express.json());

// Example route
app.get("/", (req, res) => {
  res.send("Server is running ✅");
});

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))

app.use(express.json({limit: "200kb"}))
app.use(express.urlencoded({extented: true, limit: "20kb"}))
app.use(express.static("public"))
app.use(cookieParser());

import router from "./routes/user.routes.js"

app.use("/api/v1/users", router)

export { app }