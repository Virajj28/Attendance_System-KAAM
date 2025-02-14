const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const webPush = require("web-push");
const cron = require("node-cron");
const User = require("./models/User");
const Attendance = require("./models/Attendance");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// const uri = "mongodb+srv://user0:user0@cluster0.w22uk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected Successfully!"))
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  });

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/attendance", attendanceRoutes);

webPush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

let subscriptions = [];
app.post("/api/subscribe", (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  res.status(201).json({ msg: "Subscription registered successfully!" });
});

app.post("/api/test-push", (req, res) => {
  const testMessage = {
    title: "Test Notification",
    body: "This is a test push notification from the backend.",
  };

  subscriptions.forEach((subscription) => {
    webPush
      .sendNotification(subscription, JSON.stringify(testMessage))
      .catch((err) => console.error("Push notification error:", err));
  });

  res.json({ msg: "Test notification sent!" });
});

const sendPushNotification = (message) => {
  subscriptions.forEach((subscription) => {
    webPush
      .sendNotification(
        subscription,
        JSON.stringify({ title: "Attendance Reminder", body: message })
      )
      .catch((err) => console.error("Push notification error:", err));
  });
};

// Notify Employees Who Forgot to Check Out (Runs at 8 PM Daily)
cron.schedule("0 20 * * *", async () => {
  console.log("Checking for employees who forgot to check out...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const employees = await Attendance.find({
    date: { $gte: today, $lt: new Date(today).setHours(23, 59, 59, 999) },
    checkIn: { $ne: null },
    checkOut: null,
  }).populate("userId", "name");

  employees.forEach((record) => {
    sendPushNotification(`${record.userId.name}, you forgot to check out!`);
    console.log(`Sent check-out reminder to ${record.userId.name}`);
  });
});

// Remind Employees to Check In (Runs at 10 AM Daily)
cron.schedule("0 10 * * *", async () => {
  console.log(" Checking for employees who haven't checked in...");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkedInUsers = await Attendance.find({
    date: { $gte: today, $lt: new Date(today).setHours(23, 59, 59, 999) },
  }).distinct("userId");

  const allEmployees = await User.find({ role: "employee" });
  const employeesToRemind = allEmployees.filter(
    (emp) => !checkedInUsers.includes(emp._id.toString())
  );

  employeesToRemind.forEach((employee) => {
    sendPushNotification(
      `${employee.name}, don't forget to check in today!`
    );
    console.log(`Sent check-in reminder to ${employee.name}`);
  });
});


app.get("/", (req, res) => res.send("Server is running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
