const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' })); 
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully!"))
    .catch(err => console.error("MongoDB Connection Failed:", err));

// Define what a student's data looks like
const RegistrationSchema = new mongoose.Schema({
    name: String,
    phone: String,
    email: String,
    college: String,
    year: String,
    collegeId: String,
    cart: Array,
    billing: Object,
    paymentStatus: { type: String, default: "Pending" }, // Will update to Paid after checkout
    createdAt: { type: Date, default: Date.now }
});

const Registration = mongoose.models.Registration || mongoose.model('Registration', RegistrationSchema);

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.rzp_test_Ty6feL7TwmtMIm,
    key_secret: process.env.tCrhnjc1i5ic33p3h0TyAPqY
});

// Health Checks
app.get('/', (req, res) => res.status(200).send("Vortex Backend is Live and Running! 🚀"));
app.get('/api/test', (req, res) => res.status(200).send("API routing is working perfectly! ✅"));

// 1. Registration Route (Saves to MongoDB)
app.post('/api/register', async (req, res) => {
    try {
        const data = req.body;
        console.log(`Saving Registration for: ${data.name}`);
        
        // Save entry to database
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

// 2. Razorpay Order Creation Route
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