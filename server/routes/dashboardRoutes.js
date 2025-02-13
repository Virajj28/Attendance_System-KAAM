const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Attendance = require("../models/Attendance");
const User = require("../models/User");

const router = express.Router();

// Get Dashboard Data for Employee
router.get("/employee", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const attendance = await Attendance.find({ userId }).sort({ date: -1 });

    res.json({
      user: req.user,
      attendanceHistory: attendance,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Get Dashboard Data for Admin
router.get("/admin", authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied, admin only" });
    }

    const users = await User.find();
    const attendance = await Attendance.find().populate("userId", "name email");

    res.json({ users, attendance });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});


module.exports = router;
