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

    const fetchmessages = async () => {
        if (uuid) {
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
        <div>
            <HomeComponent user={user} conversations={conversations} messages={messages} uuid={uuid} onSubmit={handleSubmit} />
        </div>
    );
}

export default Home