import { useState } from "react";
import { Eye, EyeOff, Lock, MessageCircle, User } from "lucide-react";
import "./Login.scss";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../apis/apis";
import alertify from 'alertifyjs';

const Login = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // if (!username.trim() || !password.trim()) {
    //   setError("Please enter username and password.");
    //   return;
    // }

    try {
      setLoading(true);

      await login({username, password}).then((response) => {
        if (response.data.success) {
          localStorage.setItem("username",response.data.data.username);
          localStorage.setItem("email",response.data.data.email);
          localStorage.setItem("token",response.data.data.token);
          alertify.success(response.data.message);
          navigate("/chat");
        }
      }).catch((error) => {
        const response = error.response?.data;

        if (response?.errors) {
          Object.values(response.errors).forEach((message) => {
            alertify.error(message);
          });
        } else {
          alertify.error(
            response?.message || "Login failed. Please try again."
          );
        }
      });

    } catch (error) {
      console.error(error);
      alertify.error("Unable to Login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-logo">
          <MessageCircle size={28} />
        </div>

        <h1>Welcome Back</h1>
        <p className="login-subtitle">
          Sign in to continue to Chat
        </p>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label htmlFor="username">
              Username
            </label>

            <div className="input-wrapper">
              <User size={18} />

              <input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <div className="input-wrapper">
              <Lock size={18} />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="form-control"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              className="forgot-password"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>

        <p className="signup-text">
          Don't have an account?{" "}
          <Link to="/register" className="signup-link text-decoration-none">
            Create account
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;