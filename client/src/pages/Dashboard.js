import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    const fetchDashboard = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BACKEND_SERVER_URI}/api/dashboard/employee`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(res.data.user);
        setAttendance(res.data.attendanceHistory);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        navigate("/");
      }
    };

    fetchDashboard();
  }, [token, navigate]);

  const handleCheckIn = async () => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_SERVER_URI}/api/attendance/check-in`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage(res.data.msg);
      setAttendance([...attendance, res.data.attendance]); // Update attendance history
    } catch (err) {
      setMessage(err.response?.data?.msg || "Check-in failed.");
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_SERVER_URI}/api/attendance/check-out`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage(res.data.msg);
      setAttendance(
        attendance.map((record) =>
          record._id === res.data.attendance._id ? res.data.attendance : record
        )
      );
    } catch (err) {
      setMessage(err.response?.data?.msg || "Check-out failed.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-200">
      {user ? (
        <>
          <h2 className="text-2xl font-bold">Welcome, {user.name}!</h2>
          {message && <p className="text-red-500">{message}</p>}

          <div
            style={{
              display: "flex",
              marginTop: "1rem",
            }}
          >
            <button
              style={{
                backgroundColor: "#10B981",
                color: "white",
                padding: "10px 20px",
                margin: "0 8px",
                borderRadius: "0.375rem",
                cursor: "pointer",
                width: "auto",
              }}
              onClick={handleCheckIn}
            >
              Check-In
            </button>
            <button
              style={{
                backgroundColor: "#F87171",
                color: "white",
                padding: "10px 20px",
                margin: "0 8px",
                borderRadius: "0.375rem",
                cursor: "pointer",
                width: "auto",
              }}
              onClick={handleCheckOut}
            >
              Check-Out
            </button>
          </div>

          <h3 className="text-xl mt-4">Your Attendance History</h3>
          <ul className="mt-4 bg-white p-4 rounded-lg shadow-lg">
            {attendance.map((record) => (
              <li key={record._id} className="border-b p-1">
                <div>
                  {new Date(record.date).toDateString()}: Check-In:{" "}
                  {record.checkIn
                    ? new Date(record.checkIn).toLocaleTimeString()
                    : "N/A"}{" "}
                  | Check-Out:{" "}
                  {record.checkOut
                    ? new Date(record.checkOut).toLocaleTimeString()
                    : "N/A"}
                  <p>Completed Work Hours: {Number(record?.workHours).toFixed(2) || "--"}</p>
                </div>
              </li>
            ))}
          </ul>

          <button
            className="bg-gray-500 text-white px-4 py-2 rounded mt-4"
            onClick={handleLogout}
          >
            Logout
          </button>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Dashboard;
