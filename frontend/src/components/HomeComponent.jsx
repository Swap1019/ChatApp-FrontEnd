import { PersonCircle, Person, InfoCircle, PeopleFill, People ,List ,Search, ArrowRightCircleFill, ArrowRightCircle} from 'react-bootstrap-icons';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { useState, useEffect, useRef } from "react";
import { useNavigate,Navigate } from "react-router";
import "../styles/Home.css";
import "../styles/Base.css";
import api from "../api"; 

function HomeComponent({user,conversations,messages,uuid,UserUpdateSubmit}) {
    const [content, setContent] = useState("");
    const [searchUsers, setSearchUsers] = useState("");
    const [searchResults, setsearchResults] = useState([]);
    const [currentConversationIsGroup, setCurrentConversationIsGroup] = useState([]);
    const [socket, setSocket] = useState("");
    const [chatName, setChatName] = useState("");
    const [chatImg, setChatImg] = useState(null);
    const [members, setMembers] = useState();
    const [privateUser, setPrivateUser] = useState();
    const [liveConversations, setLiveConversations] = useState(conversations || []);
    const [liveMessage, setLiveMessage] = useState(messages || []);
    const [nickName, setNickName] = useState("");
    const [profile, setProfile] = useState("");
    const [profilePreview, setProfilePreview] = useState("");
    const [bio, setBio] = useState("");
    const [userName, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [backGroundImage, setBackGroundImage] = useState("");
    const [backgroundPreview, setBackgroundPreview] = useState(null);
    

    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const handleChatClick = (conversation) => {
        setCurrentConversationIsGroup(conversation?.is_group || "");
        setChatName(conversation?.name || "");
        setChatImg(conversation?.profile_url || "");
        openChat();
        navigate(`/${conversation?.id}`);
    };

    const handleSearchUserClick = async (user) => {
        try {
            const res = await api.post(`/chat/conversations/private/`, {
                user_id: user.id,
            });

            const conversation = res.data.conversation;

            if (!conversation?.id) {
                console.error("Conversation ID missing!", res.data);
                return;
            }

            // If it's not a group, override name and profile with the user's info
            if (!conversation.is_group) {
                conversation.name = user.nickname;
                conversation.profile_url = user.profile_url;
            }

            // Add conversation to liveConversations if it doesn't exist yet
            setLiveConversations((prev) => {
                const exists = prev.some((c) => c.id === conversation.id);
                if (!exists) {
                    return [...prev, conversation];
                }
                return prev;
            });

            setCurrentConversationIsGroup(conversation?.is_group || "");
            setChatName(conversation.name); // already set above for private chat
            setChatImg(conversation.profile_url); // already set above for private chat
            openChat();
            navigate(`/${conversation?.id}`);

        } catch (err) {
            console.error("Error fetching conversation:", err);
        }
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
                .get(`/chat/${uuid}/members/`)
                .then((res) => res.data)
                .then((data) => {
                    if (currentConversationIsGroup) {
                        setMembers(data.members);
                    } else {
                        setPrivateUser(data.other_user);
                    }
                })
                .catch((err) => alert(err));
        }
    }

    const getsearchresults = async (searchUsers) => {
        if (searchUsers) {
            setsearchResults([]);

            await api
                .get(`/chat/search/users/?q=${searchUsers}`)
                .then((res) => res.data)
                .then((data) => {
                    if (data.length != 0) {
                        setsearchResults(data);
                    } else {
                        alert("No user was found");
                    }
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
        const textarea = document.querySelector("textarea");
        if (textarea) {
            textarea.focus();
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
        if (user) {
        setProfile(user.profile || "");
        setProfilePreview(user.profile_url|| "");
        setUserName(user.username || "");
        setEmail(user.email || "");
        setNickName(user.nickname || "");
        setFirstName(user.first_name || "");
        setLastName(user.last_name || "");
        setBio(user.bio || "");
        setBackGroundImage(user.background_image || "");
        setBackgroundPreview(user.background_image_url || "");
        }
    }, [user]);


    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() =>{
        setLiveMessage(messages || [])
    }, [messages]);

    useEffect(() =>{
        setLiveConversations(conversations || [])
    }, [conversations]);


    useEffect(() => {
        if (!uuid) return;

        const token = localStorage.getItem("access");
        const ws = new WebSocket(`ws://127.0.0.1:8000/chat/${uuid}/?token=${token}`);

        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "ping" }));
            }
        }, 25000);

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

        return () => {
            clearInterval(pingInterval);
            ws.close();
        }
    }, [uuid]);

    useEffect(() => {
        scrollToBottom();
        console.log(liveMessage)
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
                                    {chatImg ? 
                                        <img src={chatImg} alt="Profile" id="chatHeaderImg" className="m-0 me-2 avatar" style={{width:"60px",height:"60px"}} />
                                        :
                                        <People size={60} className="border border-white rounded-circle me-2"/>
                                    }
                                    <div className="d-flex flex-column">
                                        <h1 className="modal-title fs-5">{chatName}</h1>
                                        <span className="fw-lighter text-white">{members?.length} members</span>
                                    </div>
                                    <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                
                                <div className="modal-body">
                                    {members?.map((member) => (
                                        <div data-bs-target={`#${member.id}`} data-bs-toggle="modal">
                                            <div className="row p-3 user-row">
                                                <div className="col user">
                                                    {member.profile_url ? (
                                                        <img className="avatar me-3" src={member.profile_url} alt="Profile" style={{width: "50px" ,height:"50px"}} />
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
                                            {member.profile_url ? (
                                                <img className="avatar me-3" src={member.profile_url} alt="Profile" style={{width: "60px" ,height:"60px"}} />
                                            ) : (
                                                <PersonCircle className="avatar me-3" style={{width: "50px" ,height:"50px"}} />
                                            )}
                                            <span className="fw-bold" style={{fontSize: "18px"}}>{member.nickname}</span>
                                        </h1>
                                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="container">
                                            <div className="row">
                                                <div className="col-1 me-4">
                                                    <InfoCircle style={{width:"30px" ,height:"30px"}}/>
                                                </div>
                                                <div className="col-8">
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

                                                <div className="col-8 ms-5 ">
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

                    {/* Private Chat user modal */}
                        <div className="modal fade " id="private-user-modal" aria-hidden="true" aria-labelledby="exampleModalToggleLabel2" tabIndex={-1} key="private-user-modal">
                            <div className="modal-dialog modal-dialog-centered modal-fullscreen-md-down">
                                <div className="modal-content theme-gray">
                                    <div className="modal-header">
                                        <h1 className="modal-title fs-5" id="exampleModalToggleLabel2">        
                                            {privateUser?.profile_url ? (
                                                <img className="avatar me-3" src={privateUser?.profile_url} alt="Profile" style={{width: "60px" ,height:"60px"}} />
                                            ) : (
                                                <PersonCircle className="avatar me-3" style={{width: "50px" ,height:"50px"}} />
                                            )}
                                            <span className="fw-bold" style={{fontSize: "18px"}}>{privateUser?.nickname}</span>
                                        </h1>
                                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="container">
                                            <div className="row">
                                                <div className="col-1 me-4">
                                                    <InfoCircle style={{width:"30px" ,height:"30px"}}/>
                                                </div>
                                                <div className="col-8">
                                                    <span className="fw-normal">
                                                        {privateUser?.bio}
                                                    </span>
                                                    <p className="fw-ligher text-secondary">
                                                        bio
                                                    </p>
                                                    <span className="fw-normal">
                                                        @{privateUser?.username}
                                                    </span>
                                                    <p className="fw-ligher text-secondary">
                                                        username
                                                    </p>
                                                </div>

                                                <div className="col-8 ms-5 ">
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

                    {/* User settings modal */}
                    <div className="modal fade " id="user-settings" aria-hidden="true" aria-labelledby="exampleModalToggleLabel2" tabIndex={-1} key="user-settings">
                        <div className="modal-dialog modal-dialog-centered modal-fullscreen-md-down">
                            <div className="modal-content theme-gray">
                                <div className="modal-header">
                                    <h1>
                                        <div className="d-flex justify-content-center mb-4 align-items-center">
                                            <div data-mdb-ripple-init className="btn">
                                                <label htmlFor="customFile2" style={{cursor:'pointer'}}>
                                                    {profilePreview ? ( 
                                                        <img className="avatar me-3" src={profilePreview} alt="Profile" style={{width: "80px" ,height:"80px"}} id="selectedAvatar"/>
                                                    ) : (
                                                        <PersonCircle className="avatar me-3" style={{width: "80px" ,height:"80px"}} />
                                                    )}
                                                </label>
                                                  <input
                                                    type="file"
                                                    className="d-none"
                                                    id="customFile2"
                                                    onChange={(event) => {
                                                    const file = event.target.files[0];
                                                    if (!file) return;
                                                    setProfile(file);

                                                    const reader = new FileReader();
                                                    reader.onload = (e) => {
                                                        setProfilePreview(e.target.result);
                                                    };
                                                    reader.readAsDataURL(file);
                                                    }}
                                                />
                                                <p className="fw-ligher text-secondary">
                                                    Profile   -tap to edit-
                                                </p>
                                            </div>
                                            <input
                                                type="text"
                                                value={nickName}
                                                className="input-style theme-lighter-gray"
                                                onChange={(e) => setNickName(e.target.value)}
                                                placeholder="Nick Name"
                                            />
                                        </div>
                                    </h1>
                                    <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div className="modal-body">
                                    <div class="container">
                                        <div class="row">
                                            <div class="col-1 me-4">
                                                <InfoCircle style={{width:"30px" ,height:"30px"}}/>
                                            </div>
                                            <div class="col-8">
                                                <input
                                                    type="text"
                                                    value={bio}
                                                    className="input-style theme-lighter-gray"
                                                    onChange={(e) => setBio(e.target.value)}
                                                    placeholder="Bio"
                                                />
                                                <p className="fw-ligher text-secondary">
                                                    bio
                                                </p>
                                                <input
                                                    type="text"
                                                    value={userName}
                                                    className="input-style theme-lighter-gray"
                                                    onChange={(e) => setUserName(e.target.value)}
                                                    placeholder="Username"
                                                />
                                                <p className="fw-ligher text-secondary">
                                                    username
                                                </p>
                                                <input
                                                    type="text"
                                                    value={email}
                                                    className="input-style theme-lighter-gray"
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="Email"
                                                />
                                                <p className="fw-ligher text-secondary">
                                                    email
                                                </p>
                                                <input
                                                    type="text"
                                                    value={firstName}
                                                    className="input-style theme-lighter-gray"
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    placeholder="First name"
                                                />
                                                <p className="fw-ligher text-secondary">
                                                    First Name
                                                </p>
                                                <input
                                                    type="text"
                                                    value={lastName}
                                                    className="input-style theme-lighter-gray"
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    placeholder="Last name"
                                                />
                                                <p className="fw-ligher text-secondary">
                                                    Last Name
                                                </p>

                                                <label htmlFor="backgroundFile" style={{ cursor: 'pointer' }}>
                                                    <img
                                                        id="selectedBackground"
                                                        src={backgroundPreview || "https://res.cloudinary.com/dwfngrwoe/image/upload/v1758392790/default_hgh8gm.webp"}
                                                        alt="Background"
                                                        style={{
                                                            width: "300px",
                                                            height: "180px",
                                                            objectFit: "cover",
                                                            borderRadius: "10px",
                                                            border: "2px solid #555",
                                                        }}
                                                    />
                                                </label>
                                                <input
                                                    type="file"
                                                    id="backgroundFile"
                                                    className="d-none"
                                                    accept="image/png, image/jpeg, image/jpg, image/webp"
                                                    onChange={(event) => {
                                                        const file = event.target.files[0];
                                                        if (!file) return;
                                                        setBackGroundImage(file)

                                                        const reader = new FileReader();
                                                        reader.onload = (e) => {
                                                           setBackgroundPreview(e.target.result);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }}
                                                />
                                                <p className="fw-ligher text-secondary">
                                                    BackGround Image -tap to edit-
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex justify-content-end">
                                    <button 
                                    className="d-flex justify-content-center align-items-center mb-4 me-4 p-2 rounded-2 submit-button" 
                                    style={{width:"100px", height:"40px",}}
                                    onClick={() =>
                                        UserUpdateSubmit({
                                        profile: profile,
                                        username: userName,
                                        email: email,
                                        nickname: nickName,
                                        first_name: firstName,
                                        last_name: lastName,
                                        bio: bio,
                                        background_image:backGroundImage,
                                        })}>
                                        Update
                                    </button>
                                </div>
                                
                            </div>
                        </div>
                    </div>

                    {/* Main Page */}
                    <div className="chat-container">
                        <div className="sidebar" id="sidebar">
                            <div className="d-flex align-items-center justify-content-start mb-3 mt-2" style={{ gap: "8px" }}>
                                <button
                                    className="btn btn-sm btn-secondary rounded-circle d-flex align-items-center justify-content-center ms-1"
                                    type="button"
                                    data-bs-toggle="offcanvas"
                                    data-bs-target="#offcanvasWithBothOptions"
                                    aria-controls="offcanvasWithBothOptions"
                                    style={{ width: "35px", height: "35px", flexShrink: 0 }}
                                >
                                    <List size={20} />
                                </button>

                                {/* Wide search bar on the right */}
                                <div className="d-inline-flex align-items-center justify-content-center w-100" style={{backgroundColor: "#535353ff" , borderRadius: "8px" , height:"37px"}}>
                                    <input
                                    type="text"
                                    className="form-control m-0"
                                    placeholder="Search chats..."
                                    id="searchInput"
                                    value={searchUsers} 
                                    onChange={(e) => setSearchUsers(e.target.value)}
                                    style={{
                                    flexGrow: 1,
                                    borderRadius: "8px",
                                    border: "None",
                                    backgroundColor: "#535353ff",
                                    color: "white",
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            getsearchresults(searchUsers);
                                        }
                                    }}
                                    />
                                    {searchUsers 
                                        ? 
                                        <button
                                            type="button"
                                            className="btn btn-primary d-flex align-items-center justify-content-center rounded-2 ms-0"
                                            style={{ width: "35px", height: "35px" }}
                                            onClick={() => getsearchresults(searchUsers)}
                                        >
                                            <Search size={20} />
                                        </button>
                                        :
                                        <button type="button" class="btn btn-secondary d-flex align-items-center justify-content-center rounded-2 ms-0" style={{width:"35px",height:"35px"}}>
                                            <Search size={20}/>
                                        </button>
                                    }

                                </div>

                            </div>
                            
                            {/* Off-canvas */}
                            <div className="offcanvas offcanvas-start text-bg-dark" data-bs-scroll="true" tabIndex={-1} id="offcanvasWithBothOptions" aria-labelledby="offcanvasWithBothOptionsLabel">
                                <div className="offcanvas-header">
                                    <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                                </div>
                                <div className="offcanvas-body">
                                    <a className="btn text-white d-flex justify-content-start account-control-button" role="button" data-bs-toggle="modal" data-bs-target={"#user-settings"}>
                                        <h5 className="ms-2 d-flex justify-content-center align-items-center">
                                            {user.profile_url ? 
                                                <img className="avatar me-2" src={user.profile_url} />
                                                :
                                                <PersonCircle size={40} className="border border-white rounded-circle me-2"/>
                                            }
                                            {user?.nickname}
                                        </h5>
                                    </a>
                                    <a className="btn text-white d-flex justify-content-start mt-1 account-control-button" role="button" data-bs-toggle="modal" data-bs-target="#">
                                        <h5 className="ms-2 d-flex justify-content-center align-items-center">
                                            <Person size={40} className="border border-white rounded-circle me-2"/>
                                            Contacts
                                        </h5>
                                    </a>
                                </div>
                            </div>
                            <div className="chat-list">
                                {searchUsers ? (
                                    <>
                                    {(searchResults.length !== 0) ? (
                                        searchResults?.map((searchResult) => (
                                            <div
                                                key={searchResult?.id}
                                                className="list-group-item chat-item"
                                                onClick={() => handleSearchUserClick(searchResult)}
                                            >
                                                {searchResult.profile_url ? (
                                                <img className="m-0" src={searchResult.profile_url} />
                                                ) : (
                                                <People size={35} className="border border-white rounded-circle" />
                                                )}

                                                <span className="ms-2">{searchResult?.nickname}</span>
                                            </div>
                                        ))
                                    ) : 
                                        <div className="d-flex justify-content-center align-items-center">
                                            <p>Search for Users</p>
                                        </div>
                                    }
                                    </>
                                ) : (
                                    liveConversations?.map((conversation) => (
                                    <div
                                        key={conversation?.id}
                                        className="list-group-item chat-item"
                                        onClick={() => handleChatClick(conversation)}
                                    >
                                        {conversation.profile_url ? (
                                        <img className="m-0" src={conversation.profile_url} />
                                        ) : (
                                        <People size={35} className="border border-white rounded-circle" />
                                        )}

                                        <span className="ms-2">{conversation?.name}</span>
                                    </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Chat content */}
                        <div className="chat-content" id="chatContent" style={{ backgroundImage: `url(${user?.background_image_url ? user.background_image_url : "https://res.cloudinary.com/dwfngrwoe/image/upload/v1758392790/default_hgh8gm.webp"})`}}>
                            {chatName ? 
                            <div className="chat-header">
                                {/* Group modal button */}
                                <button id="backBtn" onClick={backToChats}>←</button>
                                <div type="button" data-bs-toggle="modal" data-bs-target={currentConversationIsGroup ? "#groupModal" : "#private-user-modal"} onClick={getmembers}>
                                    {chatImg ? 
                                        <img src={chatImg} alt="Profile" id="chatHeaderImg" className="m-0" />
                                        :
                                        <People size={35} className="border border-white rounded-circle"/>
                                    }
                                    
                                    <span id="chatName" className="ms-2">{chatName}</span>
                                </div>
                            </div>
                            :
                            <div/>
                            }
                            <div className="messages">
                                {liveMessage?.map((message) => (
                                    user.id === message.sender.id ?
                                        <div className="message sent">
                                            {message.sender.profile_url ? (
                                                <a role="button" data-bs-toggle="modal" data-bs-target={`#${message.sender.id}`}>
                                                    <img src={message.sender.profile_url} className="avatar"   />
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
                                            {message.sender.profile_url ? (
                                                <img src={message.sender.profile_url} className="avatar" />
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
                            {uuid ? (
                                <>
                            <form className="chat-input" onSubmit={(e) => {
                                    e.preventDefault();
                                    sendMessage();
                                    setContent("");
                                    const textarea = e.target.querySelector("textarea");
                                    if (textarea) textarea.focus();
                                    }}>
                                        <textarea
                                        placeholder="Type a message..."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            sendMessage();
                                            setContent("");
                                            }
                                        }}
                                        />

                                        <div
                                        className="d-flex justify-content-center align-items-center"
                                        style={{ backgroundColor: "#1b1d20" }}
                                        >
                                        {content ? (
                                            <button
                                            type="submit"
                                            className="btn btn-primary d-flex justify-content-center align-items-center rounded-pill me-2"
                                            style={{ width: "50px", height: "35px" }}
                                            onClick={sendMessage}
                                            >
                                            <ArrowRightCircleFill size={40} />
                                            </button>
                                        ) : (
                                            <button
                                            type="submit"
                                            className="btn btn-secondary d-flex justify-content-center align-items-center rounded-pill me-2"
                                            style={{ width: "50px", height: "35px" }}
                                            disabled
                                            >
                                            <ArrowRightCircle size={40} />
                                            </button>
                                        )}
                                        </div>
                            </form>
                            </>
                                ) 
                                :
                                <div className="d-flex justify-content-center">
                                    <p>Please select a chat to start messaging</p>
                                </div>
                                }
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

export default HomeComponent;