import { Gear, PersonCircle, Send, ArrowLeft } from 'react-bootstrap-icons';
import { Link } from "react-router-dom";
import React from 'react';
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import "../styles/Home.css";
import "../styles/Base.css";

function HomeComponent({user,conversations,messages,uuid}) {
    const [content, setContent] = useState("");
    const [socket, setSocket] = useState("");
    const [liveMessage, setLiveMessage] = useState(messages || []);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const handleChatClick = (conversation) => {
        openChat(conversation?.name, conversation?.profile);
        navigate(`/${conversation?.id}`);
    };


    function prettyDate(time) {
            var date = new Date(time);
            return date.toLocaleTimeString(navigator.language, {
                hour: '2-digit',
                minute:'2-digit',
        });
    }

    function openChat(name, imgSrc) {
        document.getElementById('chatName').innerText = name;
        document.getElementById('chatHeaderImg').src = imgSrc;

        if (window.innerWidth <= 768) {
            document.getElementById('chatContent').classList.add('show');
            document.getElementById('sidebar').classList.add('hide');
        }
    }

    function backToChats() {
        if (window.innerWidth <= 768) {
            document.getElementById('chatContent').classList.remove('show');
            document.getElementById('sidebar').classList.remove('hide');
        }
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
    const handleResize = () => {
        if (window.innerWidth > 768) {
            document.getElementById('chatContent').classList.remove('show');
            document.getElementById('sidebar').classList.remove('hide');
        }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    }, []);


    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() =>{
        setLiveMessage(messages || [])
    }, [messages]);

    useEffect(() => {
        if (!uuid) return;

        const token = localStorage.getItem("access");
        const ws = new WebSocket(`${import.meta.env.VITE_API_URL}`);

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
        <div className="chat-container">
            <div className="sidebar" id="sidebar">
                <input type="text" placeholder="Search chats..." id="searchInput" />
                <div className="chat-list">
                {conversations?.map((conversation) => (
                    <div
                    key={conversation?.id}
                    className="list-group-item chat-item"
                    onClick={() => handleChatClick(conversation)}
                    >
                    <img src={conversation.profile} />
                    <span>{conversation?.name}</span>
                    </div>
                ))}
                </div>
            </div>

            {/* Chat content */}
            <div className="chat-content" id="chatContent" style={{ backgroundImage: `url(${user?.background_image ? user.background_image : "https://res.cloudinary.com/dwfngrwoe/image/upload/v1758392790/default_hgh8gm.webp"})`}}>
                {uuid ? 
                <div className="chat-header">
                    <button id="backBtn" onClick={backToChats}>←</button>
                    <img src="" alt="Profile" id="chatHeaderImg" />
                    <span id="chatName">Chat Name</span>
                </div>
                :
                <div/>
                }
                <div className="messages">
                    {liveMessage?.map((message) => (
                        user.id === message.sender.id ?
                            <div className="message sent">
                                {message.sender.profile ? (
                                    <img src={message.sender.profile} className="avatar" />
                                ) : (
                                    <PersonCircle className="avatar" />
                                )}
                                <div className="message-bubble">
                                    <div className="message-header">
                                        <span className="nickname">{message?.sender.nickname}</span>
                                        <span className="time">{prettyDate(message?.created_at)}</span>
                                    </div>
                                    <div className="message-content">
                                        {message?.content}
                                    </div>
                                </div>
                            </div>
                            :
                            <div className="message received">
                                {message.sender.profile ? (
                                    <img src={message.sender.profile} className="avatar" />
                                ) : (
                                    <PersonCircle size={35} />
                                )}
                                <div className="message-bubble">
                                    <div className="message-header">
                                        <span className="nickname">{message?.sender.nickname}</span>
                                        <span className="time">{prettyDate(message?.created_at)}</span>
                                    </div>
                                    <div className="message-content">
                                        {message?.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                </div>

                <form className="chat-input" onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                        setContent("");
                        }}>
                    <textarea
                            placeholder="Type a message..."
                            value={content} 
                            onChange={(e) => setContent(e.target.value)}
                        >
                    </textarea>
                    <button type="submit" class="send-icon-button">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="25" height="25" fill="currentColor" class="bi bi-send send-icon">
                            <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"></path>
                        </svg>
                    </button>
                </form>
                
            </div>
        </div>
    );
}

export default HomeComponent;
