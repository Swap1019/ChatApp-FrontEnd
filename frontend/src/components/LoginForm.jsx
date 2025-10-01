import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Form.css"
import LoadingIndicator from "./LoadingIndicator";
import { Eye, EyeSlash } from "react-bootstrap-icons";

function Form({ route, method }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        try {
            const res = await api.post(route, { username, password })
            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
            navigate("/")
        } catch (error) {
            alert(error)        
        } finally {
            setLoading(false)
        }
    };

    return (
        <div className="form-container">
            <h2>Login</h2>
            <form id="multiStepForm" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label for="username">Username</label>
                    <input 
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)} 
                        id="username" 
                        required
                    />
                </div>
                <div className="form-password" style={{ position: "relative" }}>
                    <label for="password">Password </label>
                    <input 
                        className="password"
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
                            cursor: "pointer"
                        }}
                    >
                        {showPassword ? <EyeSlash style={{width: "20px" , height: "20px"}} /> : <Eye style={{width: "20px" , height: "20px"}} />}
                    </span>
                </div>

                {loading && <LoadingIndicator />}
                <button type="submit" className="btn btn-primary mt-3">
                    Login
                </button>
                <div className="bottom-link">
                    <Link to="/register">
                        <span>Don't have an account?</span>
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default Form