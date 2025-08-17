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

  const handleCheckOut = async (checkedIn) => {
    try {
      console.log("Checked In Time:", checkedIn);

      // react-dom-client.development.js:5841 Uncaught Error: Too many re-renders. React limits the number of renders to prevent an infinite loop.
      // Errors for this block of code:
      // 1. The function handleCheckOut is being called immediately instead of being passed as
      //    an event handler. This causes the function to execute immediately when the component renders,
      //    leading to an infinite loop of re-renders.

      //checkIn should be more than 24 hours ago checkedIn is 2025-07-01T07:02:49.465Z
      const checkInDate = new Date(checkedIn);
      const currentDate = new Date();

      // Check if the check-in time is more than 24 hours ago
      if (currentDate - checkInDate < 24 * 60 * 60 * 1000) {
        setMessage("You can only check out after 24 hours of checking in.");
        return;
      }

      if (currentDate - checkInDate < 24 * 60 * 60 * 1000) {
        setMessage("You can only check out after 24 hours of checking in.");
        return;
      } else {
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
            record._id === res.data.attendance._id
              ? res.data.attendance
              : record
          )
        );
      }
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
            {/* <button
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
            </button> */}
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
                  <p>
                    Completed Work Hours:{" "}
                    {Number(record?.workHours).toFixed(2) || "--"}
                  </p>
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
                    onClick={() => {
                      handleCheckOut(record.checkIn);
                    }}
                  >
                    Check-Out
                  </button>
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
