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

    const fetchdata = () => {
        api
            .get("/chat/")
            .then((res) => res.data)
            .then((data) => {
                setUser(data.user);
                setConversations(data.conversations)
                console.log(data);
            })
            .catch((err) => alert(err));
    };

    const fetchmessages = () => {
        if (uuid) {
            api
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
        <div>
            <HomeComponent user={user} conversations={conversations} messages={messages} />
        </div>
    );
}

export default Home