import { Gear, PersonCircle, Send, ArrowLeft } from 'react-bootstrap-icons';
import { Link } from "react-router-dom";
import React from 'react';
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

    function openChat(name, imgSrc) {
        document.getElementById('chatName').innerText = name;
        document.getElementById('chatHeaderImg').src = imgSrc;

        if (window.innerWidth <= 768) {
        document.getElementById('chatContent').classList.add('show');
        document.getElementById('sidebar').style.display = 'none';
        }
    }

    function backToChats() {
        document.getElementById('chatContent').classList.remove('show');
        document.getElementById('sidebar').style.display = 'flex';
    }

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
        document.getElementById('chatContent').classList.remove('show');
        document.getElementById('sidebar').style.display = 'flex';
        }
    });
    
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
        <div className="chat-container">
            <div className="sidebar" id="sidebar">
                <input type="text" placeholder="Search chats..." id="searchInput" />
                <div className="chat-list">
                {conversations?.map((conversation) => (
                    conversation?.id !== uuid ? (
                    <Link
                    to={conversation?.id}
                    key={conversation?.id}
                    className="list-group-item chat-item"
                    onClick={() => openChat(conversation?.name, 'https://i.pravatar.cc/40?img=1')}
                    >
                    {conversation.profile ? (
                        <img src={conversation.profile} className="avatar" />
                    ) : (
                        <PersonCircle size={35} />
                    )}
                    <span>{conversation?.name}</span>
                    </Link>
                ) : (
                    <button
                    key={conversation?.id}
                    className="list-group-item chat-item"
                    style={{width:"100%"}}
                    onClick={() => openChat(conversation?.name, 'https://i.pravatar.cc/40?img=1')}
                    >
                    {conversation.profile ? (
                        <img src={conversation.profile} className="avatar" />
                    ) : (
                        <PersonCircle size={35} />
                    )}
                    <span>{conversation?.name}</span>
                    </button>
                )
                ))}
                </div>
            </div>

            {/* Chat content */}
            <div className="chat-content" id="chatContent" style={{ backgroundImage: `url(${user?.background_image})`}}>
                <div className="chat-header">
                    <button id="backBtn" onClick={backToChats}>←</button>
                    <img src="https://i.pravatar.cc/40?img=1" alt="Profile" id="chatHeaderImg" />
                    <span id="chatName">Chat Name</span>
                </div>
                <div className="messages">
                    {liveMessage?.map((message) => (
                        user.id === message.sender.id ?
                            <div className="message sent">
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
                    <button type="submit">
                            <Send size={25} className="send-icon" />
                    </button>
                </form>
                
            </div>
        </div>
    );
}

export default HomeComponent;
