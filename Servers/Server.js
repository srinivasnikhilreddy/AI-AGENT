import dotenv from 'dotenv';
dotenv.config();

console.log("Loaded GROQ_API_KEY:", process.env.GROQ_API_KEY);

import express from 'express';
import cors from 'cors';
import { handleAI } from '../index.js';

const app = express();
const PORT = 8987;

app.use(cors());
app.use(express.json());

//AI API Endpoint
app.post('/api/ai', async (req, res) => {
    try{
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: "Query is required." });
        }

        const AIAnswer = await handleAI(query); // Process AI response
        res.json({ response: AIAnswer });

    }catch(err){
        console.error("❌ Error while processing AI request:", err);
        res.status(500).json({ error: "Alas! Internal Server Error." });
    }
});

//Start Server
app.listen(PORT, () => console.log(`🚀 Backend API is running at http://localhost:${PORT}`));
