import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { handler } from "./app.js";
import connectDB from "./db.js";

dotenv.config();

// Connect to Database
connectDB();


const app = express();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || "0.0.0.0";

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors({ origin: "*" }));

// Health Check Route
app.get("/", (req, res) => {
    res.status(200).send("SES Mailer Service is running.");
});



// Main Handler Route
app.post("/", async (req, res) => {
    try {
        // Construct event object to mimic Lambda
        const event = {
            body: req.body, // In Lambda, body is a string, but express.json() parses it. Handler expects parsed or string.
            // Add other properties if needed by handler in future
        };
        console.log(event)
        const result = await handler(event);

        // Handle Lambda proxy response format
        const responseBody = typeof result.body === 'string' ? JSON.parse(result.body) : (result.body || {});
        const statusCode = result.statusCode || 200;

        res.status(statusCode).json(responseBody);
    } catch (error) {
        console.error("Error in handler wrapper:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// // 404 Handler for undefined routes
// app.use((req, res) => {
//     res.status(404).json({ message: "Route not found" });
// });

// // Global Error Handler
// app.use((err, req, res, next) => {
//     console.error("Unhandled Application Error:", err);
//     res.status(500).json({ message: "Internal Server Error" });
// });

app.listen(PORT, HOST, () => {
    console.log(`Server is running heavily on http://${HOST}:${PORT}`);
});
