const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');
const crypto = require('crypto');
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
    paymentId: String,
    orderId: String,
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

// 5. Payment Verification & DB Status Update Route
app.post('/api/verify-payment', async (req, res) => {
    try {
        await connectDB();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, phone } = req.body;

        // Verify signature using Razorpay Key Secret
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Invalid payment signature" });
        }

        // Update the student's latest pending record to Paid
        const updatedStudent = await Registration.findOneAndUpdate(
            { email, phone, paymentStatus: "Pending" },
            {
                paymentStatus: "Paid",
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id
            },
            { sort: { createdAt: -1 }, new: true }
        );

        res.status(200).json({ 
            success: true, 
            message: "Payment verified and DB updated", 
            student: updatedStudent 
        });
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, message: "Failed to verify payment" });
    }
});

module.exports = app;