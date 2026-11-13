const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' })); 
app.use(express.json());

// 1. Serverless MongoDB Connection Function
const connectDB = async () => {
    if (mongoose.connections[0].readyState) {
        return; // Use existing connection if already awake
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully!");
};

// 2. Define Student Blueprint
const RegistrationSchema = new mongoose.Schema({
    name: String,
    phone: String,
    email: String,
    college: String,
    year: String,
    collegeId: String,
    cart: Array,
    billing: Object,
    paymentStatus: { type: String, default: "Pending" }, 
    createdAt: { type: Date, default: Date.now }
});

const Registration = mongoose.models.Registration || mongoose.model('Registration', RegistrationSchema);

// 3. Registration Route
app.post('/api/register', async (req, res) => {
    try {
        await connectDB(); // Wait for DB to fully connect FIRST
        
        const data = req.body;
        console.log(`Saving Registration for: ${data.name}`);
        
        const newStudent = new Registration(data);
        const savedStudent = await newStudent.save();

        res.status(200).json({ 
            success: true, 
            message: "Student saved to DB",
            studentId: savedStudent._id 
        });
    } catch (error) {
        console.error("DB Save Error:", error);
        res.status(500).json({ success: false, message: "Server Error saving to DB" });
    }
});

// 4. Razorpay Order Route
app.post('/api/create-order', async (req, res) => {
    try {
        // Initialize Razorpay inside the route to securely catch env variables on demand
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const { amount } = req.body;
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