import { Gear, PersonCircle, Send } from 'react-bootstrap-icons';
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../styles/Home.css";
import "../styles/Base.css";

function HomeComponent({user,conversations,messages,uuid}) {
    const [content, setContent] = useState("");
    const [socket, setSocket] = useState("");
    const [liveMessage, setLiveMessage] = useState(messages || []);
    const messagesEndRef = useRef(null);


    function prettyDate(time) {
            var date = new Date(time);
            return date.toLocaleTimeString(navigator.language, {
                hour: '2-digit',
                minute:'2-digit',
        });
    }
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const sendMessage = () => {
        if (!content.trim()) return;

        const msg = {
            text: content
        };

        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(msg));
        }
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() =>{
        setLiveMessage(messages || [])
    }, [messages]);

    useEffect(() => {
        if (!uuid) return;

        const token = localStorage.getItem("access");
        const ws = new WebSocket(`ws://127.0.0.1:8000/chat/${uuid}/?token=${token}`);

        ws.onopen = () => {
            console.log("Websocket opened");
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.message) {
                setLiveMessage((prev) => [...prev, data.message]);
            }
        };

        ws.onclose = () => {
            console.log("Websocket closed");
        };

        setSocket(ws);

        return () => ws.close();
    }, [uuid]);



    useEffect(() => {
        scrollToBottom();
    }, [liveMessage]);

    return (
        <div className="d-flex">
            <div className="theme-dark side-container">
                {/* Search box */}
                <div className="input-group search-box">
                    <button className="rounded-circle bars-button theme-gray" type="button"
                        data-bs-toggle="offcanvas"
                        data-bs-target="#offcanvasWithBothOptions"
                        aria-controls="offcanvasWithBothOptions">
                        <i className="fa-solid fa-bars"></i>
                    </button>
                    <input type="text" className="ms-2 rounded-pill text-white theme-gray" placeholder="  search" />
                </div>

                {/* Offcanvas */}
                <div className="offcanvas offcanvas-start theme-gray"
                    data-bs-scroll="true" tabIndex="-1"
                    id="offcanvasWithBothOptions"
                    aria-labelledby="offcanvasWithBothOptionsLabel">
                    <div className="offcanvas-header">
                        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                    </div>
                    <div className="offcanvas-body">
                        <Link to="/profile/" className="text-decoration-none text-white">
                            <div className="offcanvas-section p-2 rounded-4">
                                {user && user.profile ? (
                                    <img className="rounded-circle" src={user?.profile} width="45" height="45" />
                                ) : (
                                    <PersonCircle size={35} />
                                )}
                                <span className="ms-3 mt-1">
                                    {user?.nickname} 
                                </span>
                                <div className="d-inline-flex position-absolute end-0 me-5 mt-1">
                                    <Gear size={35}/>
                                </div>           
                            </div>
                            
                        </Link>
                        <hr />
                    </div>
                </div>

                {/* Chats section */}
                <div className="overflow-auto text-white chats-section theme-dark">
                    <div className="list-group">
                        {conversations?.map((conversation) => (
                        <Link
                            to={conversation?.id}
                            key={conversation?.id}
                            className="list-group-item d-flex align-items-start chat-preview theme-gray"
                        >
                            <img src="https://avatars.githubusercontent.com/u/120246081?v=4" className="chat-avatar me-3" />
                            <div className="d-flex flex-column justify-content-between flex-grow-1 chat-body">
                                <div className="d-flex justify-content-between">
                                    <div className="fw-bold">{conversation?.name}</div>
                                    <div className="text-white small"></div>
                                </div>
                            </div>
                        </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main chat */}
            <div className="flex-grow-1 text-white bg-secondary main-chat d-flex flex-column p-3" 
                style={{ backgroundImage: `url(${user?.background_image})` }}
            >
                {liveMessage?.map((message) => (
                    user.id === message.sender.id ? 
                    <div className="d-flex align-items-start rounded-4 p-2 mb-2 chat-message-sent">
                        {message.sender.profile ? (
                                    <img src={message.sender.profile} className="chat-avatar me-3" />
                                ) : (
                                <PersonCircle size={35} />
                        )}
                        <div className="d-flex flex-column">
                            <div className="d-flex justify-content-between">
                                <div className="fw-bold">{message?.sender.nickname}</div>
                                <div className="text-white-50 small ms-3">{prettyDate(message?.created_at)}</div>
                            </div>
                            <div>{message?.content}</div>
                        </div>
                    </div>
                    :
                    <div className="d-flex align-items-start rounded-4 p-2 mb-2 chat-message-recieved">
                        <div className="d-flex flex-column">
                            <div className="d-flex justify-content-between">
                                <div className="text-white-50 small me-3">{prettyDate(message?.created_at)}</div>
                                <div className="fw-bold">{message?.sender.nickname}</div>
                            </div>
                            <div>{message?.content}</div>
                        </div>
                        {message.sender.profile ? (
                            <img src={message.sender.profile} className="chat-avatar ms-3" />
                        ) : (
                        <PersonCircle size={35} />
                        )}
                    </div>
                ))}
                <div className="mt-5">
                    <form className="chat-input-container d-flex" onSubmit={(e) => {
                            e.preventDefault();
                            sendMessage();
                            setContent("");
                        }}>
                        <textarea className="chat-textbox theme-gray" rows="1"
                            value={content} 
                            onChange={(e) => setContent(e.target.value)}
                            >
                        </textarea>
                        <button type="submit" className="send-icon-button">
                            <Send size={25} className="send-icon" />
                        </button>
                    </form>
                </div>
                <div ref={messagesEndRef} />
            </div>
        </div>

    );
}

export default HomeComponent;
