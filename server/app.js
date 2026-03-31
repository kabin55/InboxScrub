import express from 'express'
import cors from 'cors';
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";


import { emailRoutes } from './modules/email/index.js'
import { authRoutes } from "./modules/auth/index.js";
import { userRoutes } from "./modules/user/index.js";
import { adminRoutes } from "./modules/admin/index.js";
import { campaignRoutes } from "./modules/campaign/index.js";
import { trackingRoutes } from "./modules/tracking/index.js";
import { templateRoutes } from "./modules/template/index.js";
import { whatsappRoutes } from "./modules/whatsapp/index.js";

const app = express()
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(helmet({ crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" } }));

app.use(cors({
  origin: ["http://localhost:3000",
    "http://localhost:8000",
    "http://ec2-54-156-101-212.compute-1.amazonaws.com/",
    "http://54.156.101.212:3000",
    "https:deepakclass.info",
    "https:www.deepakclass.info",
    "https://decade-pursuant-cdt-regime.trycloudflare.com"
  ],
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
app.use('/api/whatsapp', whatsappRoutes)

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
