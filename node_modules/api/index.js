const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' })); 
app.use(express.json());

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// NEW: Visual Health Check Route
app.get('/', (req, res) => {
    res.status(200).send("Vortex Backend is Live and Running! 🚀");
});
app.get('/api/test', (req, res) => {
    res.status(200).send("API routing is working perfectly! ✅");
});

// 1. Existing Registration Route (Saves their details)
app.post('/api/register', async (req, res) => {
    try {
        const data = req.body;
        console.log(`Registration attempt: ${data.name}`);
        // Later, we will save this to a database (MongoDB/Firebase)
        res.status(200).json({ success: true, message: "Data received" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// 2. NEW: Razorpay Order Creation Route
app.post('/api/create-order', async (req, res) => {
    try {
        const { amount } = req.body;
        
        // Razorpay expects the amount in PAISE (₹1 = 100 paise)
        const options = {
            amount: Math.round(amount * 100), 
            currency: "INR",
            receipt: `rcpt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({ success: true, order });

    } catch (error) {
        console.error("Razorpay Error:", error);
        res.status(500).json({ success: false, message: "Failed to create order" });
    }
});

module.exports = app;