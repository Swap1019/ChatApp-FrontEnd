import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Form.css"
import LoadingIndicator from "./LoadingIndicator";

function Form({ route, method }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
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
            alert("Username or password is wrong")        
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
                <div className="form-group">
                    <label for="password">Password</label>
                    <input 
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)} 
                        id="password" 
                        required
                    />
                </div>
                {loading && <LoadingIndicator />}
                <button type="submit" className="btn btn-primary">
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