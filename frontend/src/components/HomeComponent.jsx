import { PersonCircle, InfoCircle,} from 'react-bootstrap-icons';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { useState, useEffect, useRef } from "react";
import { useNavigate,Navigate } from "react-router";
import "../styles/Home.css";
import "../styles/Base.css";
import api from "../api"; 

function HomeComponent({user,conversations,messages,uuid,fetchmembers}) {
    const [content, setContent] = useState("");
    const [socket, setSocket] = useState("");
    const [chatName, setChatName] = useState("");
    const [chatImg, setChatImg] = useState(null);
    const [members, setMembers] = useState();
    const [liveMessage, setLiveMessage] = useState(messages || []);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const handleChatClick = (conversation) => {
        setChatName(conversation?.name || "");
        setChatImg(conversation?.profile || "");
        openChat();
        navigate(`/${conversation?.id}`);
    };


    function prettyDate(time) {
            var date = new Date(time);
            return date.toLocaleTimeString(navigator.language, {
                hour: '2-digit',
                minute:'2-digit',
        });
    }

    function openChat() {
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

    const getmembers = async () => {
        if (uuid && user) {
            await api
                .get(`/chat/${uuid}/members`)
                .then((res) => res.data)
                .then((data) => {
                    setMembers(data.members);
                    console.log(data)
                })
                .catch((err) => alert(err));
        }
    }

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
<<<<<<< HEAD
        const ws = new WebSocket(`wss://${import.meta.env.VITE_API_URL}/chat/${uuid}/?token=${token}`);
=======
        const ws = new WebSocket(`ws://127.0.0.1:8000/chat/${uuid}/?token=${token}`);
>>>>>>> dev

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
        <>  
            {user === null ? (
                <Navigate to="/" replace />
            ) : (
                <>
                    {/* Group modal */}
                    <div className="modal fade" id="groupModal" aria-hidden="true" aria-labelledby="groupModal" tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-scrollable modal-fullscreen-md-down ">
                            <div className="modal-content theme-gray">
                                <div className="modal-header">
                                    <img className="avatar me-3" src={chatImg} alt="Profile" id="chatHeaderImg" style={{width: "60px" ,height:"60px"}} />
                                    <div className="d-flex flex-column">
                                        <h1 className="modal-title fs-5">{chatName}</h1>
                                        <span className="fw-lighter text-white">{members?.length} members</span>
                                    </div>
                                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                
                                <div className="modal-body">
                                    {members?.map((member) => (
                                        <div data-bs-target={`#${member.id}`} data-bs-toggle="modal">
                                            <div className="row p-3 user-row">
                                                <div className="col user">
                                                    {member.profile ? (
                                                        <img className="avatar me-3" src={member.profile} alt="Profile" style={{width: "50px" ,height:"50px"}} />
                                                    ) : (
                                                        <PersonCircle className="avatar me-3" style={{width: "50px" ,height:"50px"}} />
                                                    )}
                                                    <span className="fw-bold" style={{fontSize: "18px"}}>{member.nickname}</span>
                                                </div>
                                            </div>
                                        </div>     
                                    ))}                      
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* User modal */}
                    {members?.map((member) => (
                        <div className="modal fade " id={`${member.id}`} aria-hidden="true" aria-labelledby="exampleModalToggleLabel2" tabIndex={-1} key={member.id}>
                            <div className="modal-dialog modal-dialog-centered modal-fullscreen-md-down">
                                <div className="modal-content theme-gray">
                                    <div className="modal-header">
                                        <div data-bs-target="#groupModal" data-bs-toggle="modal" className="me-2 user-modal-back-button">←</div>
                                        <h1 className="modal-title fs-5" id="exampleModalToggleLabel2">        
                                            {member.profile ? (
                                                <img className="avatar me-3" src={member.profile} alt="Profile" style={{width: "60px" ,height:"60px"}} />
                                            ) : (
                                                <PersonCircle className="avatar me-3" style={{width: "50px" ,height:"50px"}} />
                                            )}
                                            <span className="fw-bold" style={{fontSize: "18px"}}>{member.nickname}</span>
                                        </h1>
                                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                    </div>
                                    <div className="modal-body">
                                        <div class="container">
                                            <div class="row">
                                                <div class="col-1 me-4">
                                                    <InfoCircle style={{width:"30px" ,height:"30px"}}/>
                                                </div>
                                                <div class="col-8">
                                                    <span className="fw-normal">
                                                        {member.bio}
                                                    </span>
                                                    <p className="fw-ligher text-secondary">
                                                        bio
                                                    </p>
                                                    <span className="fw-normal">
                                                        @{member.username}
                                                    </span>
                                                    <p className="fw-ligher text-secondary">
                                                        username
                                                    </p>
                                                </div>

                                                <div class="col-8 ms-5 ">
                                                    <div className="send-message p-2">
                                                        Send Message
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <div className="add-to-contacts p-2">
                                            Add To Contacts
                                        </div>
                                        <div className="user-block p-2">
                                            Block User
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}


                    {/* Main Page */}
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
                            {chatName ? 
                            <div className="chat-header">
                                {/* Group modal button */}
                                <button id="backBtn" onClick={backToChats}>←</button>
                                <div type="button" data-bs-toggle="modal" data-bs-target="#groupModal" onClick={getmembers}>
                                    <img src={chatImg} alt="Profile" id="chatHeaderImg" />
                                    <span id="chatName">{chatName}</span>
                                </div>
                            </div>
                            :
                            <div/>
                            }
                            <div className="messages">
                                {liveMessage?.map((message) => (
                                    user.id === message.sender.id ?
                                        <div className="message sent">
                                            {message.sender.profile ? (
                                                <a role="button" data-bs-toggle="modal" data-bs-target={`#${message.sender.id}`}>
                                                    <img src={message.sender.profile} className="avatar"   />
                                                </a>
                                            ) : (
                                                <a role="button" data-bs-toggle="modal" data-bs-target={`#${message.sender.id}`}>
                                                    <PersonCircle className="avatar" />
                                                </a>
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
                                <button type="submit" className="send-icon-button">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="25" height="25" fill="currentColor" className="bi bi-send send-icon">
                                        <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"></path>
                                    </svg>
                                </button>
                            </form>
                            
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

export default HomeComponent;
