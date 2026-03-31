import { parentPort, workerData } from 'worker_threads';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { validateEmailDeliverability } from './email.validation.service.js';

// Load environment variables if needed (though they are usually inherited)
dotenv.config({ path: '../.env' });

/**
 * Connect to MongoDB for the worker thread
 */
const connectWorkerDB = async () => {
    if (mongoose.connection.readyState === 1) return;
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: process.env.DB_NAME || "authdb",
        });
        console.log(`[Worker ${process.pid}] Connected to MongoDB`);
    } catch (err) {
        console.error(`[Worker ${process.pid}] MongoDB connection error:`, err.message);
    }
};

/**
 * Handle incoming messages from the parent thread
 */
parentPort.on('message', async (data) => {
    const { email, config } = data;
    
    try {
        await connectWorkerDB();
        const result = await validateEmailDeliverability(email, config);
        parentPort.postMessage({ success: true, result });
    } catch (error) {
        parentPort.postMessage({ 
            success: false, 
            email, 
            error: error.message 
        });
    }
});
