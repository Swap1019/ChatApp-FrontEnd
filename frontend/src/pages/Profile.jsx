import { useState, useEffect } from "react";
import { REFRESH_TOKEN, ACCESS_TOKEN } from '../constants';
import ProfileComponent from "../components/ProfileComponent";
import api from "../api"; 

function Profile() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchdata();
    }, []);

    const fetchdata = () => {
        api
            .get("/user/profile/")
            .then((res) => res.data)
            .then((data) => {
                setUser(data);
                console.log(data);
            })
            .catch((err) => alert(err));
    };

    const handleSubmit = (data) => {
        try {
            const formData = new FormData();
            if (data.profile instanceof File) {
                formData.append("profile", data.profile);
            }

            Object.entries(data).forEach(([key, value]) => {
            if (key !== "profile" && value !== undefined && value !== null) {
                formData.append(key, value);
            }
            });

            api.patch("user/profile/", formData, {
                headers: { "Content-Type": "multipart/form-data" }
                })
                .then((res) => {
                if (res.status === 200) alert("Profile updated successfully!");
                else alert(`Profile update failed with status: ${res.status}`);
                })
                .catch((error) => {
                if (error.response) {
                    alert(`Update failed: ${error.response.status} - ${error.response.data.detail || JSON.stringify(error.response.data)}`);
                } else if (error.request) {
                    alert("No response from server. Please check your connection.");
                } else {
                    alert(`Error: ${error.message}`);
                }
                });
            } catch (error) {
                console.error(error);
                alert(`Unexpected error: ${error.message}`);
            }
    };


    return (
        <div>
            <ProfileComponent user={user} onSubmit={handleSubmit} />
        </div>
    );
}

export default Profile