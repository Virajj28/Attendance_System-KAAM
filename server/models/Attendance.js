const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, default: Date.now },
  checkIn: { type: Date },
  checkOut: { type: Date },
  workHours: { type: Number, default: 0 },
  status: { type: String, enum: ["Present", "Absent", "Late"], default: "Present" }
});

module.exports = mongoose.model("Attendance", AttendanceSchema);
