import { useState, useEffect } from "react";
import HomeComponent from "../components/HomeComponent";
import { useParams } from "react-router-dom";
import api from "../api"; 



function Home() {
    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState();
    const [isSuccess, setIsSuccess] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
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
            .get("/chat/",{ withCredentials: true })
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

            if (data.background_image instanceof File) {
                formData.append("background_image", data.background_image);
            }
            
            Object.entries(data).forEach(([key, value]) => {
            if (key !== "profile" && key !== "background_image" && value !== undefined && value !== null) {
                formData.append(key, value);
            }
            
            });

            api.patch("user/profile/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (progressEvent) => {
                    const progress = (progressEvent.loaded / progressEvent.total) * 50;
                    setUploadProgress(progress);
                },
                })
                .then((res) => {
                if (res.status === 200) {
                    alert("Profile updated successfully!");
                    setIsSuccess(true)
                }
                else if (res.status === 202) {
                    alert(`${res.data.detail}: ${res.status}`);
                    setIsSuccess(true)
                } else {
                    alert (`Error while profile updating ${res.status}`)
                }
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

    return (
        <HomeComponent user={user} conversations={conversations} messages={messages} uuid={uuid} UserUpdateSubmit={UserUpdateSubmit} uploadProgress={uploadProgress} uploadIsSuccess={isSuccess} /> 
    );
}

export default Home