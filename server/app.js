import express from 'express'
import cors from 'cors';
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";


import emailRoutes from './routes/email.routes.js'
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import campaignRoutes from "./routes/campaign.routes.js";
import trackingRoutes from "./routes/tracking.routes.js";
import templateRoutes from "./routes/template.routes.js";

const app = express()
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(helmet());
const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ["http://localhost:3000", "http://localhost:5173", "http://192.168.1.71:3000"];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
})
);
app.set("trust proxy", 1);
app.use("/api/auth", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
})
);

app.use("/api/email", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
})
);

app.use('/api/email', emailRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/campaign', campaignRoutes)
app.use('/api/track', trackingRoutes)
app.use('/api/templates', templateRoutes)

app.get('/', (req, res) => {
  res.send('Server is running');
});
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Everything is fine' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

export default app
