import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = ({ setUserRole }) => {
  const [user, setUser] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_SERVER_URI}/api/auth/login`,
        user
      );
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user?.role);
      setUserRole(res.data.user?.role);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        className="bg-white p-6 rounded-lg shadow-lg"
        onSubmit={handleSubmit}
      >
        <div
          style={{ marginLeft: "4px", marginRight: "4px" }}
          className="my-4 p-1 font-semibold"
        >
          <h2 className="text-3xl">KAAM-Login</h2>
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <div
          style={{ marginLeft: "4px", marginRight: "4px" }}
          class="rounded-md shadow-sm"
        >
          <div>
            <input
              type="email"
              name="email"
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none sm:text-sm"
              placeholder="name@work-email.com"
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <input
              type="password"
              name="password"
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none sm:text-sm"
              placeholder="Enter password"
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            id="btnSignIn"
            className="text-white bg-purple-900 w-full mt-6 p-2 font-semibold"
          >
            Login
          </button>
          <p className="mt-2">
            Don't have an account?{" "}
            <a href="/signup" className="text-blue-500">
              Signup
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;
