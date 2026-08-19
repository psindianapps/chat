import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import "./Register.scss";
import { register } from "../apis/api";
import alertify from "alertifyjs";
const Register = () => {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        console.log("hehlh");

        e.preventDefault();

        // if (!username.trim() || !email.trim() || !password.trim()) {
        //   alertify.error("All fields are required.");
        //   return;
        // }

        try {
            setLoading(true);

            await register({ username, email, password, status: 1 }).then((response) => {               
                if (response.data.success) {
                    alertify.success(response.data.message);
                    navigate("/login");
                }
            }).catch((error) => {
                const response = error.response?.data;

                if (response?.errors) {
                    Object.values(response.errors).forEach((message) => {
                        alertify.error(message);
                    });
                } else {
                    alertify.error(
                        response?.message || "Registration failed. Please try again."
                    );
                }
            });

        } catch (error) {
            console.error(error);
            alertify.error("Unable to create account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-card">

                <div className="register-logo">
                    <User size={28} />
                </div>

                <h1>Create Account</h1>

                <p className="register-subtitle">
                    Create your account to start chatting
                </p>

                <form onSubmit={handleSubmit}>

                    {/* Username */}
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
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="form-group">
                        <label htmlFor="email">
                            Email
                        </label>

                        <div className="input-wrapper">
                            <Mail size={18} />

                            <input
                                id="email"
                                type="email"
                                placeholder="Enter email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    {/* Password */}
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
                                autoComplete="new-password"
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword((prev) => !prev)}
                            >
                                {showPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="register-button"
                        disabled={loading}
                    >
                        {loading ? "Creating account..." : "Create Account"}
                    </button>
                </form>

                <p className="login-text">
                    Already have an account?{" "}
                    <Link to="/login" className="login-link">
                        Sign in
                    </Link>
                </p>

            </div>
        </div>
    );
};

export default Register;