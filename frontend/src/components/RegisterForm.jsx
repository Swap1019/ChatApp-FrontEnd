// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Form.css";
import LoadingIndicator from "../components/LoadingIndicator";

function Register() {
    const [userName, setUserName] = useState("");
    const [nickName, setNickName] = useState("");
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post("user/register/", {
                username: userName,
                nickname: nickName,
                email: email,
                first_name : firstName,
                last_name: lastName,
                password: password,
            });
            console.log(res);
            if (res.status === 201 || res.status === 200) {
                alert("Account created!");
                navigate("/login/");
            }
        } catch (err) {
            alert("Registration failed: " + err.response?.data?.detail || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-page">
            <form onSubmit={handleSubmit} className="form-container">
                <h1>Create an Account</h1>
                <input
                    className="form-input"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Username"
                    required
                />
                <input
                    className="form-input"
                    type="text"
                    value={nickName}
                    onChange={(e) => setNickName(e.target.value)}
                    placeholder="Nick Name"
                    required
                />
                <input
                    className="form-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                />
                <input
                    className="form-input"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    required
                />
                <input
                    className="form-input"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    required
                />
                <input
                    className="form-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                />
                <input
                    className="form-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    required
                />
                {loading && <LoadingIndicator />}
                <button className="form-button" type="submit">
                    Register
                </button>
                <Link to="/login">
                    <span>Have an account?</span>
                </Link>
            </form>
        </div>
    );
}

export default Register;
