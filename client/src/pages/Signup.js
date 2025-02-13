import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Signup = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/auth/signup", user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.msg || "Signup failed");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        className="bg-white p-6 rounded-lg shadow-lg"
        onSubmit={handleSubmit}
      >
        <h2
          style={{ marginLeft: "4px", marginRight: "4px" }}
          className="text-2xl font-bold mb-4"
        >
          KAAM-Signup
        </h2>
        {error && <p className="text-red-500">{error}</p>}
        <input
          type="text"
          name="name"
          placeholder="Name"
          className="border p-2 w-full mb-2"
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="border p-2 w-full mb-2"
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="border p-2 w-full mb-2"
          onChange={handleChange}
          required
        />
        <select
          name="role"
          style={{
            padding: "6px",
            border: "1px solid #D1D5DB",
            borderRadius: "8px",
            width: "80%",
            backgroundColor: "#FFFFFF",
            color: "#374151",
            marginLeft: "4px",
            transition:
              "background-color 0.2s ease-in-out, border-color 0.2s ease-in-out",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#F3F4F6")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#FFFFFF")}
          onFocus={(e) => {
            e.target.style.outline = "none";
            e.target.style.borderColor = "#3B82F6";
            e.target.style.boxShadow = "0 0 0 2px rgba(59, 130, 246, 0.5)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#D1D5DB";
            e.target.style.boxShadow = "none";
          }}
          onChange={handleChange}
        >
          <option value="employee" style={{ color: "#374151" }}>
            Employee
          </option>
          <option value="admin" style={{ color: "#374151" }}>
            Admin
          </option>
        </select>

        <button type="submit" className="bg-blue-500 text-white p-2 w-full">
          Signup
        </button>
        <p className="mt-2">
          Already have an account?{" "}
          <a href="/" className="text-blue-500">
            Login
          </a>
        </p>
      </form>
    </div>
  );
};

export default Signup;
