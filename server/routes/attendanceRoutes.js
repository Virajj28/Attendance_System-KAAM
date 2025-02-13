const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Attendance = require("../models/Attendance");

const router = express.Router();

// Check-in
router.post("/check-in", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingRecord = await Attendance.findOne({
      userId,
      date: { $gte: today, $lt: new Date(today).setHours(23, 59, 59, 999) }
    });

    if (existingRecord) return res.status(400).json({ msg: "Already checked in today" });

    const newAttendance = new Attendance({
      userId,
      date: today, //Here came bug of today's date checkout fixed now
      checkIn: new Date(),
    });

    await newAttendance.save();
    res.status(201).json({ msg: "Checked in successfully", attendance: newAttendance });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Check-out
router.post("/check-out", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      userId,
      date: { $gte: today, $lt: new Date(today).setHours(23, 59, 59, 999) }
    });

    if (!attendance) return res.status(400).json({ msg: "No check-in found for today" });

    if (attendance.checkOut) return res.status(400).json({ msg: "Already checked out today" });

    attendance.checkOut = new Date();
    attendance.workHours = (attendance.checkOut - attendance.checkIn) / (1000 * 60 * 60);

    await attendance.save();
    res.json({ msg: "Checked out successfully", attendance });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});


// Get Employee Attendance History
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const attendance = await Attendance.find({ userId }).sort({ date: -1 });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

//Get admin access
router.get("/admin", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const attendance = await Attendance.find().populate("userId", "name email");
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Edit Attendance Record for Admin Only
router.put("/admin/update/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const { checkIn, checkOut } = req.body;
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) return res.status(404).json({ msg: "Attendance record not found" });

    if (checkIn) attendance.checkIn = new Date(checkIn);
    if (checkOut) attendance.checkOut = new Date(checkOut);
    if (attendance.checkIn && attendance.checkOut) {
      attendance.workHours = (attendance.checkOut - attendance.checkIn) / (1000 * 60 * 60);
    }

    await attendance.save();
    res.json({ msg: "Attendance updated", attendance });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Delete Attendance Record By Admin
router.delete("/admin/delete/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) return res.status(404).json({ msg: "Attendance record not found" });

    await attendance.deleteOne();
    res.json({ msg: "Attendance record deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
