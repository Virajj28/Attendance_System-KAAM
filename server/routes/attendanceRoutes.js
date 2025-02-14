const express = require("express");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const { Parser } = require("json2csv");
const authMiddleware = require("../middleware/authMiddleware");
const Attendance = require("../models/Attendance");
const User = require("../models/User");

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

// Get filtered attd for admin
router.get("/admin/filter", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const { startDate, endDate, employeeId, department } = req.query;
    let query = {};

    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (employeeId) {
      query.userId = employeeId;
    }

    if (department) {
      const users = await User.find({ department });
      const userIds = users.map((user) => user._id);
      query.userId = { $in: userIds };
    }

    const attendance = await Attendance.find(query).populate("userId", "name email department");
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Export Filtered Attendance as CSV
router.get("/admin/export/csv", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const { startDate, endDate, employeeId, department } = req.query;
    let query = {};

    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (employeeId) {
      query.userId = employeeId;
    }

    if (department) {
      const users = await User.find({ department });
      const userIds = users.map((user) => user._id);
      query.userId = { $in: userIds };
    }

    const attendance = await Attendance.find(query).populate("userId", "name email department");

    const data = attendance.map((record) => ({
      Name: record.userId.name,
      Email: record.userId.email,
      Department: record.userId.department || "N/A",
      Date: new Date(record.date).toDateString(),
      CheckIn: record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : "N/A",
      CheckOut: record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : "N/A",
      WorkHours: record.workHours ? record.workHours.toFixed(2) : "N/A",
    }));

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("filtered_attendance_report.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Export Filtered Attendance as PDF
router.get("/admin/export/pdf", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const { startDate, endDate, employeeId, department } = req.query;
    let query = {};

    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (employeeId) {
      query.userId = employeeId;
    }

    if (department) {
      const users = await User.find({ department });
      const userIds = users.map((user) => user._id);
      query.userId = { $in: userIds };
    }

    const attendance = await Attendance.find(query).populate("userId", "name email department");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=filtered_attendance_report.pdf");

    const doc = new PDFDocument();
    doc.pipe(res);

    doc.fontSize(18).text("Filtered Attendance Report", { align: "center" });
    doc.moveDown();

    attendance.forEach((record) => {
      doc.fontSize(12).text(`Name: ${record.userId.name}`);
      doc.text(`Email: ${record.userId.email}`);
      doc.text(`Department: ${record.userId.department || "N/A"}`);
      doc.text(`Date: ${new Date(record.date).toDateString()}`);
      doc.text(`Check-In: ${record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : "N/A"}`);
      doc.text(`Check-Out: ${record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : "N/A"}`);
      doc.text(`Work Hours: ${record.workHours ? record.workHours.toFixed(2) : "N/A"}`);
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    console.error("Error generating PDF:", err);
    res.status(500).json({ msg: "Server error generating PDF" });
  }
});

module.exports = router;
