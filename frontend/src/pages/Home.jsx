import { useState, useEffect } from "react";
import HomeComponent from "../components/HomeComponent";
import { useParams } from "react-router-dom";
import api from "../api"; 



function Home() {
    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState();
    const [messages, setMessages] = useState();
    const { uuid } = useParams();

    useEffect(() => {
        fetchdata();
    }, []);

    useEffect(() => {
        fetchmessages(); 
    }, [uuid]);

    const fetchdata = async () => {
        await api
            .get("/chat/")
            .then((res) => res.data)
            .then((data) => {
                setUser(data.user);
                setConversations(data.conversations)
                console.log(data);
            })
            .catch((err) => alert(err));
    };

    const UserUpdateSubmit = (data) => {
        try {
            const formData = new FormData();
            if (data.profile instanceof File) {
                formData.append("profile", data.profile);
            }

            if (data.backgroundImage instanceof File) {
            formData.append("background_image", data.backgroundImage);
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

    const fetchmessages = async () => {
        if (uuid && user) {
            await api
                .get(`/chat/${uuid}/`)
                .then((res) => res.data)
                .then((data) => {
                    setMessages(data.messages)
                    console.log(data);
                })
                .catch((err) => alert(err));
        }
    }

    const handleSubmit = async (data) => {
            try {
                const res = await api.post("chat/message/create/", data);
                setMessages((prev) => [...prev, res.data]);
            } catch (err) {
                console.error("Error sending message:", err);
                alert("Failed to send message");
            }
    }

    return (
        <HomeComponent user={user} conversations={conversations} messages={messages} uuid={uuid} onSubmit={handleSubmit} UserUpdateSubmit={UserUpdateSubmit} /> 
    );
}

export default Home