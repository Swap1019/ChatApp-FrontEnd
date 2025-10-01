// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import "../styles/Form.css";
import LoadingIndicator from "../components/LoadingIndicator";
import { Eye, EyeSlash } from "react-bootstrap-icons";

function Register() {
    const [userName, setUserName] = useState("");
    const [nickName, setNickName] = useState("");
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');

    function nextStep() {
      step1.classList.remove('active');
      step2.classList.add('active');
    }
    function prevStep() {
      step2.classList.remove('active');
      step1.classList.add('active');
    }

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
        <div className="form-container">
            <form id="multiStepForm" onSubmit={handleSubmit}>
                {/* Step 1 */}
                <div className="form-step active" id="step1" >
                    <h2>Register</h2>
                    <div className="form-group">
                        <label htmlFor="firstname">First Name</label>
                        <input 
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)} 
                            id="firstname"
                            placeholder="Optional"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="lastname">Last Name</label>
                        <input 
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)} 
                            id="lastname" 
                            placeholder="Optional"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="nickname">Nickname</label>
                        <input 
                            type="text"
                            value={nickName}
                            onChange={(e) => setNickName(e.target.value)} 
                            id="nickname" 
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input 
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)} 
                            id="username" 
                            required
                        />
                    </div>
                    <button type="button" className="btn btn-primary" onClick={nextStep}>Next</button>
                        <div className="bottom-link">
                        <Link to="/login">
                            <span>Have an account?</span>
                        </Link>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="form-step" id="step2">
                    <button type="button" className="back-btn" onClick={prevStep}>
                        <i className="fa-solid fa-arrow-left"></i>
                    </button>
                    <h2>Step 2</h2>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input 
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)} 
                            id="email" 
                            required
                        />
                    </div>
                    <div className="form-group" style={{ position: "relative" }}>
                        <label htmlFor="password">Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            id="password"
                            required
                        />
                        <span
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: "absolute",
                                right: "10px",
                                top: "65%",
                                transform: "translateY(-50%)",
                                cursor: "pointer",
                            }}
                        >
                            {showPassword ? (
                                <EyeSlash style={{ width: "20px", height: "20px" }} />
                            ) : (
                                <Eye style={{ width: "20px", height: "20px" }} />
                            )}
                        </span>
                    </div>
                    
                    <div className="form-group" style={{ position: "relative" }}>
                        <label htmlFor="confirm">Confirm Password</label>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            id="confirmpassword"
                            required
                        />
                        <span
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{
                                position: "absolute",
                                right: "10px",
                                top: "65%",
                                transform: "translateY(-50%)",
                                cursor: "pointer",
                            }}
                        >
                            {showConfirmPassword ? (
                                <EyeSlash style={{ width: "20px", height: "20px" }} />
                            ) : (
                                <Eye style={{ width: "20px", height: "20px" }} />
                            )}
                        </span>
                    </div>
                    {loading && <LoadingIndicator />}
                    <button type="submit" className="btn btn-primary">
                        Register
                    </button>
                    <div className="bottom-link">
                        <Link to="/login">
                            <span>Have an account?</span>
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default Register;