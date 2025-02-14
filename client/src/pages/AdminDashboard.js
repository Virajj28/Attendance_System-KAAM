import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AdminDashboard = () => {
  const [attendance, setAttendance] = useState([]);
  const [editRecord, setEditRecord] = useState(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [message, setMessage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [department, setDepartment] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    const fetchAttendance = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BACKEND_SERVER_URI}/api/attendance/admin`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAttendance(res.data);
      } catch (err) {
        console.error("Error fetching admin dashboard data:", err);
        setMessage("Failed to load attendance.");
      }
    };

    fetchAttendance();
  }, [token, navigate]);

  const fetchFilteredAttendance = async () => {
    try {
      const query = `startDate=${startDate}&endDate=${endDate}&department=${department}&employeeId=${employeeId}`;
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_SERVER_URI}/api/attendance/admin/filter?${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAttendance(res.data);
    } catch (err) {
      console.error("Error fetching filtered attendance:", err);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const token = localStorage.getItem("token");
      const query = `startDate=${startDate}&endDate=${endDate}&department=${department}&employeeId=${employeeId}`;

      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_SERVER_URI}/api/attendance/admin/export/csv?${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob", // Important: Treat response as a file
        }
      );

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "filtered_attendance_report.csv"); // Set file name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error downloading CSV:", err);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem("token");
      const query = `startDate=${startDate}&endDate=${endDate}&department=${department}&employeeId=${employeeId}`;

      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_SERVER_URI}/api/attendance/admin/export/pdf?${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "filtered_attendance_report.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error downloading PDF:", err);
    }
  };

  const handleEdit = (record) => {
    setEditRecord(record);
    setCheckIn(
      record.checkIn ? new Date(record.checkIn).toISOString().slice(0, 16) : ""
    );
    setCheckOut(
      record.checkOut
        ? new Date(record.checkOut).toISOString().slice(0, 16)
        : ""
    );
  };

  const handleUpdate = async () => {
    try {
      const res = await axios.put(
        `${process.env.REACT_APP_BACKEND_SERVER_URI}/api/attendance/admin/update/${editRecord._id}`,
        { checkIn, checkOut },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttendance(
        attendance.map((record) =>
          record._id === res.data.attendance._id ? res.data.attendance : record
        )
      );
      setEditRecord(null);
      setMessage("Attendance updated successfully.");
    } catch (err) {
      setMessage("Failed to update attendance.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_SERVER_URI}/api/attendance/admin/delete/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAttendance(attendance.filter((record) => record._id !== id));
      setMessage("Attendance record deleted.");
    } catch (err) {
      setMessage("Failed to delete record.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-200">
      <h2 className="text-2xl font-bold">Admin Dashboard</h2>
      {message && <p className="text-red-500">{message}</p>}

      {/* Filter Panel */}
      <div style={{ marginTop: "16px" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              border: "1px solid #D1D5DB",
              padding: "8px",
              borderRadius: "6px",
            }}
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              border: "1px solid #D1D5DB",
              padding: "8px",
              borderRadius: "6px",
            }}
          />
          <input
            type="text"
            placeholder="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            style={{
              border: "1px solid #D1D5DB",
                    padding: "10px 20px",
                    margin: "0 8px",
                    borderRadius: "0.375rem",
                    width: "auto",
            }}
          />
          <input
            type="text"
            placeholder="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            style={{
              border: "1px solid #D1D5DB",
                    padding: "10px 20px",
                    margin: "0 8px",
                    borderRadius: "0.375rem",
                    width: "auto",
            }}
          />
          <button
            onClick={fetchFilteredAttendance}
            style={{
              backgroundColor: "#3B82F6",
              color: "white",
                    padding: "10px 20px",
                    margin: "0 8px",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    width: "auto",
            }}
          >
            Filter
          </button>
        </div>

        <div style={{ marginTop: "12px", display: "flex" }}>
          <button
            onClick={handleDownloadCSV}
            style={{
              backgroundColor: "#10B981",
              color: "white",
              padding: "10px 20px",
              margin: "0 8px",
              borderRadius: "0.375rem",
              cursor: "pointer",
              width: "auto",
            }}
          >
            Download CSV
          </button>
          <button
            onClick={handleDownloadPDF}
            style={{
              backgroundColor: "#10B981",
              color: "white",
              padding: "10px 20px",
              margin: "0 8px",
              borderRadius: "0.375rem",
              cursor: "pointer",
              width: "auto",
            }}
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Attendance List */}
      <ul className="mt-4 bg-white p-4 rounded-lg shadow-lg w-full max-w-2xl">
        {attendance.length > 0 ? (
          attendance.map((record) => (
            <li
              key={record._id}
              className="border-b p-4 flex justify-between items-center"
            >
              <div>
                <strong>{record.userId.name}</strong> -{" "}
                {new Date(record.date).toDateString()} <br />
                Check-In:{" "}
                {record.checkIn
                  ? new Date(record.checkIn).toLocaleTimeString()
                  : "N/A"}{" "}
                | Check-Out:{" "}
                {record.checkOut
                  ? new Date(record.checkOut).toLocaleTimeString()
                  : "N/A"}
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: "1rem",
                  marginBottom: "1rem",
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
                  onClick={() => handleEdit(record)}
                >
                  Edit
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
                  onClick={() => handleDelete(record._id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))
        ) : (
          <>No data to show...</>
        )}
      </ul>

      {/* Edit Attendance Modal */}
      {editRecord && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
              width: "90%",
              maxWidth: "400px",
            }}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                marginBottom: "12px",
              }}
            >
              Edit Attendance
            </h3>

            <label
              style={{ display: "block", marginTop: "10px", fontWeight: "500" }}
            >
              Check-In Time:
            </label>
            <input
              type="datetime-local"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "4px",
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
              }}
            />

            <label
              style={{ display: "block", marginTop: "10px", fontWeight: "500" }}
            >
              Check-Out Time:
            </label>
            <input
              type="datetime-local"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "4px",
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
              }}
            />

            <div
              style={{
                marginTop: "16px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <button
                style={{
                  backgroundColor: "#10B981",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border: "none",
                  marginRight: "12px",
                }}
                onClick={handleUpdate}
              >
                Save
              </button>
              <button
                style={{
                  backgroundColor: "#6B7280",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border: "none",
                  marginLeft: "12px",
                }}
                onClick={() => setEditRecord(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editRecord ? (
        <></>
      ) : (
        <button
          className="bg-gray-500 text-white px-4 py-2 rounded mt-4"
          onClick={handleLogout}
        >
          Logout
        </button>
      )}
    </div>
  );
};

export default AdminDashboard;
