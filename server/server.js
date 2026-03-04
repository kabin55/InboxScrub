import app from './app.js'
import dotenv from 'dotenv';
import connectDB from './config/db.config.js';

dotenv.config({ path: '../.env' });
connectDB();

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || 'localhost'

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`)
})
