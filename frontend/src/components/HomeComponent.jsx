import { PersonCircle, Person, InfoCircle, PeopleFill, People ,List ,Search, ArrowRightCircleFill, ArrowRightCircle, Paperclip, X, ThreeDotsVertical, CameraFill} from 'react-bootstrap-icons';
import { uploadWithTus } from '../tusUpload';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate,Navigate } from "react-router";
import "../styles/Home.css";
import "../styles/Base.css";
import api from "../api"; 

function HomeComponent({user,conversations,messages,uuid,UserUpdateSubmit}) {
    const [content, setContent] = useState("");
    const [searchUsers, setSearchUsers] = useState("");
    const [searchResults, setsearchResults] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);
    const [isContactActionLoading, setIsContactActionLoading] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [groupProfile, setGroupProfile] = useState(null);
    const [groupProfilePreview, setGroupProfilePreview] = useState("");
    const [groupFlowMode, setGroupFlowMode] = useState("create");
    const [groupMemberSearch, setGroupMemberSearch] = useState("");
    const [groupSearchResults, setGroupSearchResults] = useState([]);
    const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
    const [isGroupSubmitting, setIsGroupSubmitting] = useState(false);
    const [currentConversationIsGroup, setCurrentConversationIsGroup] = useState([]);
    const [socket, setSocket] = useState("");
    const [userSocket, setUserSocket] = useState(null);
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
    const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
    const [attachmentText, setAttachmentText] = useState("");
    const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
    const [selectedAttachments, setSelectedAttachments] = useState([]);
    const [fullscreenImageUrl, setFullscreenImageUrl] = useState("");
    const [fullscreenVideoUrl, setFullscreenVideoUrl] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyMenu, setReplyMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        messageId: null,
    });
    const [dragVisual, setDragVisual] = useState({
        messageId: null,
        offsetX: 0,
    });
    

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const lastSentRef = useRef({ text: "", ts: 0 });
    const attachmentUploadsRef = useRef([]);
    const attachmentsSnapshotRef = useRef([]);
    const dragStartRef = useRef({
        x: 0,
        y: 0,
        message: null,
        pointerId: null,
        active: false,
    });
    const chatSocketRef = useRef(null);
    const chatSocketRoomRef = useRef(null);
    const userSocketRef = useRef(null);
    const navigate = useNavigate();

    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsBaseUrl =
        import.meta.env.VITE_WS_BASE_URL || wsProtocol + "://" + window.location.hostname + ":8000";
    const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_API_URL ||
        window.location.protocol + "//" + window.location.hostname + ":8000";
    const mediaBaseUrl =
        import.meta.env.VITE_MEDIA_BASE_URL ||
        apiBaseUrl;

    function resolveUrl(url) {
        if (!url) return "";
        if (url.startsWith("http://127.0.0.1:8000/") || url.startsWith("http://localhost:8000/")) {
            const path = url.replace(/^https?:\/\/(127\.0\.0\.1|localhost):8000/, "");
            return `${mediaBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
        }
        if (
            url.startsWith("http://") ||
            url.startsWith("https://") ||
            url.startsWith("data:") ||
            url.startsWith("blob:")
        ) {
            return url;
        }
        if (url.startsWith("/")) {
            return `${mediaBaseUrl}${url}`;
        }
        return `${mediaBaseUrl}/${url}`;
    }

    const contactIds = useMemo(() => new Set(contacts.map((item) => String(item?.contact?.id))), [contacts]);
    const currentGroupMemberIds = useMemo(
        () => new Set((members || []).map((member) => String(member?.id))),
        [members]
    );
    const currentConversation = useMemo(
        () => (liveConversations || []).find((conversation) => conversation?.id === uuid) || null,
        [liveConversations, uuid]
    );
    const canManageGroup =
        !!currentConversation?.is_group &&
        (currentConversation?.viewer_is_creator || currentConversation?.viewer_is_admin);

    const handleChatClick = (conversation) => {
        setCurrentConversationIsGroup(conversation?.is_group || "");
        setChatName(conversation?.name || "");
        setChatImg(conversation?.profile_url || "");
        openChat();
        navigate(`/${conversation?.id}`);
    };

    const handleSearchUserClick = (searchedUser) => {
        if (!userSocket || userSocket.readyState !== WebSocket.OPEN) {
            console.error("User websocket is not connected yet");
            return;
        }

        userSocket.send(
            JSON.stringify({
                type: "create_private_conversation",
                user_id: searchedUser.id,
            })
        );
    };

    function prettyDate(time) {
            var date = new Date(time);
            return date.toLocaleTimeString(navigator.language, {
                hour: '2-digit',
                minute:'2-digit',
        });
    }

    function truncatePreviewText(text, maxLength = 60) {
        if (!text) return "";
        return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
    }

    function buildLastMessagePreview(conversation) {
        const preview = conversation?.last_message;
        if (!preview) return "";
        const body = (preview.content || "").trim() || "Attachment";
        const senderPrefix = preview.sender_nickname ? `${preview.sender_nickname}: ` : "";
        return truncatePreviewText(`${senderPrefix}${body}`, 58);
    }

    function upsertConversation(nextConversation, moveToTop = false) {
        if (!nextConversation?.id) return;
        setLiveConversations((prev) => {
            const normalized = {
                ...nextConversation,
                unread_count: Number(nextConversation.unread_count || 0),
            };
            const existingIndex = prev.findIndex((c) => c.id === normalized.id);
            let updatedList = prev;
            if (existingIndex >= 0) {
                updatedList = prev.map((c) => (c.id === normalized.id ? { ...c, ...normalized } : c));
            } else {
                updatedList = [...prev, normalized];
            }

            if (moveToTop) {
                const target = updatedList.find((c) => c.id === normalized.id);
                const rest = updatedList.filter((c) => c.id !== normalized.id);
                return target ? [target, ...rest] : updatedList;
            }
            return updatedList;
        });
    }

    function markConversationRead(conversationId = uuid) {
        const targetId = conversationId || uuid;
        if (!targetId) return;
        const ws = userSocketRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        ws.send(
            JSON.stringify({
                type: "mark_conversation_read",
                conversation_id: targetId,
            })
        );
    }

    const totalUploadProgress = useMemo(() => {
        if (!selectedAttachments.length) return 0;

        const totals = selectedAttachments.reduce(
            (acc, item) => {
                acc.uploaded += item.uploadedBytes || 0;
                acc.total += item.totalBytes || item.file.size || 0;
                return acc;
            },
            { uploaded: 0, total: 0 }
        );

        if (!totals.total) return 0;
        return Math.round((totals.uploaded / totals.total) * 100);
    }, [selectedAttachments]);

    function formatBytes(bytes) {
        if (!bytes) return "0 B";
        const units = ["B", "KB", "MB", "GB", "TB"];
        const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
        const value = bytes / (1024 ** idx);
        return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
    }

    function classifyFileType(file) {
        if (file.type.startsWith("image/")) return "image";
        if (file.type.startsWith("video/")) return "video";
        return "file";
    }

    function makeAttachmentItem(file) {
        const kind = classifyFileType(file);
        const hasPreview = kind === "image" || kind === "video";
        return {
            id: `${file.name}-${file.size}-${file.lastModified}-${Date.now()}-${Math.random()
                .toString(16)
                .slice(2)}`,
            file,
            kind,
            previewUrl: hasPreview ? URL.createObjectURL(file) : null,
            status: "pending",
            progress: 0,
            uploadedBytes: 0,
            totalBytes: file.size || 0,
            uploadUrl: "",
            error: "",
        };
    }

    function updateAttachment(id, patch) {
        setSelectedAttachments((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
        );
    }

    function cleanupAttachmentPreviews(items) {
        items.forEach((item) => {
            if (item.previewUrl) {
                URL.revokeObjectURL(item.previewUrl);
            }
        });
    }

    function openAttachmentPicker() {
        fileInputRef.current?.click();
    }

    function handleAttachmentSelection(event) {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;

        const newItems = files.map((file) => makeAttachmentItem(file));
        setSelectedAttachments((prev) => [...prev, ...newItems]);
        setAttachmentModalOpen(true);
        event.target.value = "";
    }

    function removeAttachment(id) {
        setSelectedAttachments((prev) => {
            const target = prev.find((item) => item.id === id);
            if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
            return prev.filter((item) => item.id !== id);
        });
    }

    function resetAttachmentComposer() {
        setSelectedAttachments([]);
        setAttachmentText("");
        setIsUploadingAttachments(false);
        setAttachmentModalOpen(false);
    }

    function updateLocalUploadMessage(messageId, patch) {
        setLiveMessage((prev) =>
            prev.map((message) =>
                message.id === messageId ? { ...message, ...patch } : message
            )
        );
    }

    function removeLocalMessage(messageId) {
        setLiveMessage((prev) => prev.filter((message) => message.id !== messageId));
    }

    function isImageMedia(url) {
        return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url || "");
    }

    function isVideoMedia(url) {
        return /\.(mp4|webm|ogg|mov|mkv|m4v)$/i.test(url || "");
    }

    function getMediaDisplayName(media, mediaUrl) {
        if (media?.name) return media.name;
        const raw = (mediaUrl || "").split("/").pop() || "attachment";
        try {
            return decodeURIComponent(raw);
        } catch {
            return raw;
        }
    }

    function openFullscreenImage(url) {
        if (!url) return;
        setFullscreenImageUrl(url);
    }

    function closeFullscreenImage() {
        setFullscreenImageUrl("");
    }

    function openFullscreenVideo(url) {
        if (!url) return;
        setFullscreenVideoUrl(url);
    }

    function closeFullscreenVideo() {
        setFullscreenVideoUrl("");
    }

    function closeAttachmentModal() {
        attachmentUploadsRef.current.forEach((upload) => {
            try {
                upload.abort();
            } catch {
                // Ignore upload abort errors on close.
            }
        });
        attachmentUploadsRef.current = [];
        cleanupAttachmentPreviews(selectedAttachments);
        resetAttachmentComposer();
    }

    async function uploadSelectedAttachments() {
        if (!selectedAttachments.length || isUploadingAttachments) return;

        const attachmentsSnapshot = selectedAttachments;
        const captionSnapshot = attachmentText;
        const totalBytes = attachmentsSnapshot.reduce(
            (sum, item) => sum + (item.file.size || 0),
            0
        );

        const localMessageId = `local-upload-${Date.now()}-${Math.random()
            .toString(16)
            .slice(2)}`;
        const previewListText = attachmentsSnapshot
            .map((item) => `- ${item.file.name}`)
            .join("\n");
        const initialMessageText = [captionSnapshot.trim(), previewListText]
            .filter(Boolean)
            .join("\n");

        setLiveMessage((prev) => [
            ...prev,
            {
                id: localMessageId,
                content: initialMessageText || "Uploading attachments...",
                sender: {
                    id: user?.id,
                    nickname: user?.nickname || "You",
                    profile_url: user?.profile_url || null,
                },
                created_at: new Date().toISOString(),
                is_read: false,
                reply_to: null,
                upload_status: "Uploading 0%",
                upload_progress: 0,
            },
        ]);

        cleanupAttachmentPreviews(attachmentsSnapshot);
        resetAttachmentComposer();

        (async () => {
            const completedUploads = [];
            let completedBytes = 0;

            try {
                for (const item of attachmentsSnapshot) {
                    await new Promise((resolve, reject) => {
                        const upload = uploadWithTus(item.file, {
                            onProgress: ({ uploaded }) => {
                                const overallUploaded = completedBytes + uploaded;
                                const percent = totalBytes
                                    ? Math.min(100, Math.round((overallUploaded / totalBytes) * 100))
                                    : 100;
                                updateLocalUploadMessage(localMessageId, {
                                    upload_status: `Uploading ${percent}%`,
                                    upload_progress: percent,
                                });
                            },
                            onSuccess: ({ uploadUrl }) => {
                                completedUploads.push({
                                    name: item.file.name,
                                    url: uploadUrl,
                                    kind: item.kind,
                                    size: item.file.size || 0,
                                });
                                completedBytes += item.file.size || 0;
                                resolve();
                            },
                            onError: (err) => reject(err),
                        });

                        attachmentUploadsRef.current.push(upload);
                    });
                }

                updateLocalUploadMessage(localMessageId, {
                    content: captionSnapshot.trim() || "Uploaded attachments",
                    upload_status: "Uploaded",
                    upload_progress: 100,
                });

                const didSend = sendMessage(captionSnapshot.trim(), {
                    attachments: completedUploads,
                });
                if (didSend) {
                    removeLocalMessage(localMessageId);
                } else {
                    updateLocalUploadMessage(localMessageId, {
                        upload_status: "Upload done, message send failed",
                    });
                }
            } catch (error) {
                console.error("Attachment upload failed", error);
                updateLocalUploadMessage(localMessageId, {
                    upload_status: "Upload failed",
                });
            }
        })();
    }

    const messagesById = useMemo(() => {
        const map = new Map();
        liveMessage?.forEach((msg) => {
            map.set(String(msg.id), msg);
        });
        return map;
    }, [liveMessage]);

    const resolveReplyTarget = (message) => {
        if (!message?.reply_to) return null;
        if (typeof message.reply_to === "object") return message.reply_to;
        return messagesById.get(String(message.reply_to)) || null;
    };

    const startReply = (message) => {
        if (!message) return;
        setReplyingTo(message);
        setReplyMenu((prev) => ({ ...prev, visible: false, messageId: null }));
        textareaRef.current?.focus();
    };

    const openReplyMenu = (event, message) => {
        event.stopPropagation();
        setReplyMenu({
            visible: true,
            x: event.clientX,
            y: event.clientY,
            messageId: message.id,
        });
    };

    const onDragReplyStart = (event, message) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        dragStartRef.current = {
            x: event.clientX,
            y: event.clientY,
            message,
            pointerId: event.pointerId,
            active: true,
        };
        if (event.currentTarget?.setPointerCapture) {
            event.currentTarget.setPointerCapture(event.pointerId);
        }
    };

    const onDragReplyMove = (event) => {
        if (!dragStartRef.current.active || !dragStartRef.current.message) return;
        if (
            dragStartRef.current.pointerId !== null &&
            event.pointerId !== dragStartRef.current.pointerId
        ) {
            return;
        }

        const deltaX = event.clientX - dragStartRef.current.x;
        const leftOffset = Math.min(0, Math.max(deltaX, -90));

        setDragVisual({
            messageId: dragStartRef.current.message.id,
            offsetX: leftOffset,
        });
    };

    const onDragReplyEnd = (event) => {
        if (!dragStartRef.current.active || !dragStartRef.current.message) return;
        if (
            dragStartRef.current.pointerId !== null &&
            event.pointerId !== dragStartRef.current.pointerId
        ) {
            return;
        }

        const deltaX = dragStartRef.current.x - event.clientX;
        const deltaY = Math.abs(dragStartRef.current.y - event.clientY);

        if (deltaX > 60 && deltaY < 70) {
            startReply(dragStartRef.current.message);
        }

        setDragVisual({ messageId: null, offsetX: 0 });

        if (event.currentTarget?.releasePointerCapture) {
            try {
                event.currentTarget.releasePointerCapture(event.pointerId);
            } catch {
                // Ignore if pointer capture is already released.
            }
        }

        dragStartRef.current = {
            x: 0,
            y: 0,
            message: null,
            pointerId: null,
            active: false,
        };
    };

    const onDragReplyCancel = () => {
        setDragVisual({ messageId: null, offsetX: 0 });
        dragStartRef.current = {
            x: 0,
            y: 0,
            message: null,
            pointerId: null,
            active: false,
        };
    };

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

    const getContacts = async () => {
        setIsLoadingContacts(true);
        try {
            const { data } = await api.get("/chat/contacts/");
            setContacts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch contacts", err);
        } finally {
            setIsLoadingContacts(false);
        }
    };

    const addToContacts = async (targetUserId) => {
        if (!targetUserId || isContactActionLoading) return;
        if (String(targetUserId) === String(user?.id)) return;
        if (contactIds.has(String(targetUserId))) return;

        setIsContactActionLoading(true);
        try {
            const { data } = await api.post("/chat/contacts/", { user_id: targetUserId });
            if (data?.contact) {
                setContacts((prev) => {
                    const exists = prev.some(
                        (item) => String(item?.contact?.id) === String(data.contact.contact?.id)
                    );
                    return exists ? prev : [data.contact, ...prev];
                });
            } else {
                await getContacts();
            }
            alert(data?.detail || "Contact added.");
        } catch (err) {
            const detail = err?.response?.data?.detail || "Could not add contact.";
            alert(detail);
        } finally {
            setIsContactActionLoading(false);
        }
    };

    const removeFromContacts = async (targetUserId) => {
        if (!targetUserId || isContactActionLoading) return;
        setIsContactActionLoading(true);
        try {
            await api.delete(`/chat/contacts/${targetUserId}/`);
            setContacts((prev) =>
                prev.filter((item) => String(item?.contact?.id) !== String(targetUserId))
            );
        } catch (err) {
            const detail = err?.response?.data?.detail || "Could not remove contact.";
            alert(detail);
        } finally {
            setIsContactActionLoading(false);
        }
    };

    const closeBootstrapModal = (modalId) => {
        const modalNode = document.getElementById(modalId);
        if (!modalNode || !window.bootstrap?.Modal) return;
        const instance =
            window.bootstrap.Modal.getInstance(modalNode) ||
            new window.bootstrap.Modal(modalNode);
        instance.hide();
    };

    const resetGroupFlow = () => {
        if (groupProfilePreview) {
            URL.revokeObjectURL(groupProfilePreview);
        }
        setGroupName("");
        setGroupProfile(null);
        setGroupProfilePreview("");
        setGroupMemberSearch("");
        setGroupSearchResults([]);
        setSelectedGroupMembers([]);
        setIsGroupSubmitting(false);
    };

    const openCreateGroupFlow = () => {
        resetGroupFlow();
        setGroupFlowMode("create");
    };

    const openAddMembersFlow = async () => {
        setGroupFlowMode("add-members");
        setGroupMemberSearch("");
        setGroupSearchResults([]);
        setSelectedGroupMembers([]);
        await getmembers();
    };

    const handleGroupProfileChange = (event) => {
        const file = event.target.files?.[0];
        if (groupProfilePreview) {
            URL.revokeObjectURL(groupProfilePreview);
        }
        if (!file) {
            setGroupProfile(null);
            setGroupProfilePreview("");
            return;
        }
        setGroupProfile(file);
        setGroupProfilePreview(URL.createObjectURL(file));
    };

    const fileToDataUrl = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Could not read file."));
            reader.readAsDataURL(file);
        });

    const toggleSelectedGroupMember = (member) => {
        const memberId = String(member?.id || "");
        if (!memberId || memberId === String(user?.id)) return;

        setSelectedGroupMembers((prev) => {
            const exists = prev.some((entry) => String(entry.id) === memberId);
            if (exists) return prev.filter((entry) => String(entry.id) !== memberId);
            return [...prev, member];
        });
    };

    const searchUsersForGroup = async () => {
        const query = groupMemberSearch.trim();
        if (!query) {
            setGroupSearchResults([]);
            return;
        }

        try {
            const { data } = await api.get(`/chat/search/users/?q=${query}`);
            setGroupSearchResults(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to search users for group", err);
        }
    };

    const submitGroupFlow = async () => {
        if (isGroupSubmitting) return;
        if (!userSocketRef.current || userSocketRef.current.readyState !== WebSocket.OPEN) {
            alert("User websocket is not connected yet.");
            return;
        }
        setIsGroupSubmitting(true);

        try {
            const memberIds = selectedGroupMembers.map((member) => String(member.id));
            if (groupFlowMode === "add-members") {
                if (!uuid) return;
                userSocketRef.current.send(
                    JSON.stringify({
                        type: "add_group_members",
                        conversation_id: uuid,
                        member_ids: memberIds,
                    })
                );
                closeBootstrapModal("groupMembersModal");
                closeBootstrapModal("groupCreateModal");
                resetGroupFlow();
            } else {
                let profileDataUrl = "";
                if (groupProfile instanceof File) {
                    profileDataUrl = await fileToDataUrl(groupProfile);
                }
                userSocketRef.current.send(
                    JSON.stringify({
                        type: "create_group_conversation",
                        name: groupName || "",
                        member_ids: memberIds,
                        profile_data_url: profileDataUrl,
                        profile_name: groupProfile?.name || "",
                    })
                );
                closeBootstrapModal("groupMembersModal");
                closeBootstrapModal("groupCreateModal");
                resetGroupFlow();
            }
        } catch (err) {
            const detail = err?.response?.data?.detail || "Group action failed.";
            alert(detail);
            setIsGroupSubmitting(false);
        }
    };


    const sendMessage = (messageText = content, options = {}) => {
        const attachments = options.attachments || [];
        const text = (messageText || "").trim();
        if (!text && !attachments.length) return false;

        const now = Date.now();
        if (
            lastSentRef.current.text === text &&
            now - lastSentRef.current.ts < 800 &&
            !attachments.length
        ) {
            return false;
        }

        if (socket && socket.readyState === WebSocket.OPEN) {
            const payload = { text };
            if (replyingTo?.id) {
                payload.reply_to = replyingTo.id;
            }
            if (attachments.length) {
                payload.attachments = attachments;
            }
            socket.send(JSON.stringify(payload));
            lastSentRef.current = { text, ts: now };
            setReplyingTo(null);

            const textarea = document.querySelector("textarea");
            if (textarea) {
                textarea.focus();
            }
            return true;
        }

        return false;
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
        setProfilePreview(resolveUrl(user.profile_url || ""));
        setUserName(user.username || "");
        setEmail(user.email || "");
        setNickName(user.nickname || "");
        setFirstName(user.first_name || "");
        setLastName(user.last_name || "");
        setBio(user.bio || "");
        setBackGroundImage(user.background_image || "");
        setBackgroundPreview(resolveUrl(user.background_image_url || ""));
        getContacts();
        }
    }, [user]);


    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const closeReplyMenu = () => {
            setReplyMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        };

        window.addEventListener("click", closeReplyMenu);
        return () => window.removeEventListener("click", closeReplyMenu);
    }, []);

    useEffect(() => {
        setReplyMenu({ visible: false, x: 0, y: 0, messageId: null });
        setReplyingTo(null);
    }, [uuid]);

    useEffect(() => {
        attachmentsSnapshotRef.current = selectedAttachments;
    }, [selectedAttachments]);

    useEffect(() => {
        return () => {
            attachmentUploadsRef.current.forEach((upload) => {
                try {
                    upload.abort();
                } catch {
                    // Ignore upload abort errors on unmount.
                }
            });
            cleanupAttachmentPreviews(attachmentsSnapshotRef.current);
        };
    }, []);

    useEffect(() =>{
        setLiveMessage(messages || [])
    }, [messages]);

    useEffect(() =>{
        setLiveConversations(conversations || [])
    }, [conversations]);

    useEffect(() => {
        if (!uuid || !userSocket) return;
        if (userSocket.readyState !== WebSocket.OPEN) return;
        markConversationRead(uuid);
    }, [uuid, userSocket]);


    useEffect(() => {
        if (!uuid) return;

        const current = chatSocketRef.current;
        if (
            current &&
            chatSocketRoomRef.current === uuid &&
            (current.readyState === WebSocket.OPEN ||
                current.readyState === WebSocket.CONNECTING)
        ) {
            return;
        }

        if (current) {
            current.close();
            chatSocketRef.current = null;
            chatSocketRoomRef.current = null;
        }

        const token = localStorage.getItem("access");
        const ws = new WebSocket(wsBaseUrl + "/chat/" + uuid + "/?token=" + token);
        chatSocketRef.current = ws;
        chatSocketRoomRef.current = uuid;

        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "ping" }));
            }
        }, 25000);

        ws.onopen = () => {
            console.log("Websocket opened");
            markConversationRead(uuid);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.message) {
                setLiveMessage((prev) => [...prev, data.message]);
                if (String(data.message?.sender?.id) !== String(user?.id)) {
                    markConversationRead(uuid);
                }
            }
        };

        ws.onclose = () => {
            console.log("Websocket closed");
            if (chatSocketRef.current === ws) {
                chatSocketRef.current = null;
                chatSocketRoomRef.current = null;
            }
        };

        setSocket(ws);

        return () => {
            clearInterval(pingInterval);
            if (chatSocketRef.current === ws) {
                chatSocketRef.current = null;
                chatSocketRoomRef.current = null;
            }
            ws.close();
        };
    }, [uuid, wsBaseUrl]);


    useEffect(() => {
    if (!user) return;

    const current = userSocketRef.current;
    if (
        current &&
        (current.readyState === WebSocket.OPEN ||
            current.readyState === WebSocket.CONNECTING)
    ) {
        return;
    }

    if (current) {
        current.close();
        userSocketRef.current = null;
    }

    const token = localStorage.getItem("access");
    const ws = new WebSocket(wsBaseUrl + "/ws/user/?token=" + token);
    userSocketRef.current = ws;

    const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
        }
    }, 25000);

    ws.onopen = () => {
        console.log("User-specific WebSocket connected");
        setUserSocket(ws);
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "new_conversation") {
            upsertConversation(data.conversation, false);
        }

        if (data.type === "private_conversation_ready") {
            const conversation = data.conversation;
            if (!conversation?.id) return;

            upsertConversation(conversation, true);

            setCurrentConversationIsGroup(conversation?.is_group || "");
            setChatName(conversation?.name || "");
            setChatImg(conversation?.profile_url || "");
            openChat();
            navigate(`/${conversation?.id}`);
        }

        if (data.type === "group_conversation_ready") {
            const conversation = data.conversation;
            if (!conversation?.id) {
                setIsGroupSubmitting(false);
                return;
            }
            upsertConversation(conversation, true);
            setCurrentConversationIsGroup(conversation?.is_group || true);
            setChatName(conversation?.name || "");
            setChatImg(conversation?.profile_url || "");
            closeBootstrapModal("groupMembersModal");
            closeBootstrapModal("groupCreateModal");
            resetGroupFlow();
            setIsGroupSubmitting(false);
            openChat();
            navigate(`/${conversation?.id}`);
        }

        if (data.type === "group_members_added") {
            if (data?.conversation) {
                upsertConversation(data.conversation, false);
            }
            closeBootstrapModal("groupMembersModal");
            resetGroupFlow();
            setIsGroupSubmitting(false);
            getmembers();
            if (data?.detail) {
                alert(data.detail);
            }
        }

        if (data.type === "conversation_update" && data.conversation) {
            upsertConversation(data.conversation, true);
        }

        if (data.type === "error") {
            setIsGroupSubmitting(false);
            console.error(data.detail || "WebSocket request failed");
        }
    };

    ws.onclose = () => {
        console.log("User-specific WebSocket disconnected");
        if (userSocketRef.current === ws) {
            userSocketRef.current = null;
        }
        setUserSocket(null);
    };

    return () => {
        clearInterval(pingInterval);
        if (userSocketRef.current === ws) {
            userSocketRef.current = null;
        }
        setUserSocket(null);
        ws.close();
    };
    }, [user?.id, navigate, wsBaseUrl]);
    useEffect(() => {
        scrollToBottom();
    }, [liveMessage]);

    return (
        <>  
            {user === null ? (
                <Navigate to="/" replace />
            ) : (
                <>
                    {fullscreenImageUrl ? (
                        <div className="image-lightbox-backdrop" onClick={closeFullscreenImage}>
                            <div className="image-lightbox-content" onClick={(e) => e.stopPropagation()}>
                                <button
                                    type="button"
                                    className="image-lightbox-close"
                                    onClick={closeFullscreenImage}
                                >
                                    <X size={24} />
                                </button>
                                <img loading="lazy" src={fullscreenImageUrl} alt="full-view" className="image-lightbox-image" />
                            </div>
                        </div>
                    ) : null}
                    {fullscreenVideoUrl ? (
                        <div className="image-lightbox-backdrop" onClick={closeFullscreenVideo}>
                            <div className="image-lightbox-content" onClick={(e) => e.stopPropagation()}>
                                <button
                                    type="button"
                                    className="image-lightbox-close"
                                    onClick={closeFullscreenVideo}
                                >
                                    <X size={24} />
                                </button>
                                <video className="image-lightbox-video" controls autoPlay>
                                    <source src={fullscreenVideoUrl} />
                                </video>
                            </div>
                        </div>
                    ) : null}
                    {/* Group modal */}
                    <div className="modal fade" id="groupModal" aria-hidden="true" aria-labelledby="groupModal" tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-scrollable modal-fullscreen-md-down ">
                            <div className="modal-content theme-gray">
                                <div className="modal-header">
                                    {chatImg ? 
                                        <img loading="lazy" src={resolveUrl(chatImg)} alt="Profile" id="chatHeaderImg" className="m-0 me-2 avatar" style={{width:"60px",height:"60px"}} />
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
                                                        <img loading="lazy" className="avatar me-3" src={resolveUrl(member.profile_url)} alt="Profile" style={{width: "50px" ,height:"50px"}} />
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
                                                <img loading="lazy" className="avatar me-3" src={resolveUrl(member.profile_url)} alt="Profile" style={{width: "60px" ,height:"60px"}} />
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
                                        <button
                                            type="button"
                                            className={`add-to-contacts p-2 ${
                                                contactIds.has(String(member.id)) ? "remove-contact" : ""
                                            }`}
                                            disabled={isContactActionLoading}
                                            onClick={() =>
                                                contactIds.has(String(member.id))
                                                    ? removeFromContacts(member.id)
                                                    : addToContacts(member.id)
                                            }
                                        >
                                            {contactIds.has(String(member.id))
                                                ? "Remove From Contacts"
                                                : "Add To Contacts"}
                                        </button>
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
                                                <img loading="lazy" className="avatar me-3" src={resolveUrl(privateUser?.profile_url)} alt="Profile" style={{width: "60px" ,height:"60px"}} />
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
                                        <button
                                            type="button"
                                            className={`add-to-contacts p-2 ${
                                                contactIds.has(String(privateUser?.id)) ? "remove-contact" : ""
                                            }`}
                                            disabled={
                                                isContactActionLoading ||
                                                !privateUser?.id
                                            }
                                            onClick={() =>
                                                contactIds.has(String(privateUser?.id))
                                                    ? removeFromContacts(privateUser?.id)
                                                    : addToContacts(privateUser?.id)
                                            }
                                        >
                                            {contactIds.has(String(privateUser?.id))
                                                ? "Remove From Contacts"
                                                : "Add To Contacts"}
                                        </button>
                                        <div className="user-block p-2">
                                            Block User
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    {/* Group create step 1 */}
                    <div className="modal fade" id="groupCreateModal" aria-hidden="true" tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-centered modal-fullscreen-md-down">
                            <div className="modal-content theme-gray">
                                <div className="modal-header">
                                    <h1 className="modal-title fs-5">Create Group</h1>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        data-bs-dismiss="modal"
                                        aria-label="Close"
                                        onClick={resetGroupFlow}
                                    />
                                </div>
                                <div className="modal-body">
                                    <div className="group-create-head">
                                        <label htmlFor="groupProfileInput" className="group-profile-picker" role="button">
                                            {groupProfilePreview ? (
                                                <img loading="lazy" src={groupProfilePreview}
                                                    alt="group profile preview"
                                                    className="group-profile-preview"
                                                />
                                            ) : (
                                                <span className="group-profile-placeholder">
                                                    <CameraFill size={20} />
                                                </span>
                                            )}
                                        </label>
                                        <input
                                            id="groupProfileInput"
                                            type="file"
                                            className="d-none"
                                            accept="image/*"
                                            onChange={handleGroupProfileChange}
                                        />
                                        <div className="group-name-wrap">
                                            <label className="form-label text-light">Group Name (optional)</label>
                                            <input
                                                type="text"
                                                className="form-control group-name-input"
                                                value={groupName}
                                                onChange={(e) => setGroupName(e.target.value)}
                                                placeholder="Type group name..."
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        data-bs-target="#groupMembersModal"
                                        data-bs-toggle="modal"
                                        onClick={() => setGroupFlowMode("create")}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Group members step */}
                    <div className="modal fade" id="groupMembersModal" aria-hidden="true" tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-centered modal-fullscreen-md-down">
                            <div className="modal-content theme-gray">
                                <div className="modal-header">
                                    <h1 className="modal-title fs-5">
                                        {groupFlowMode === "add-members" ? "Add Members" : "Create Group - Members"}
                                    </h1>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        data-bs-dismiss="modal"
                                        aria-label="Close"
                                        onClick={resetGroupFlow}
                                    />
                                </div>
                                <div className="modal-body">
                                    <div className="group-selected-members mb-3">
                                        {selectedGroupMembers.length ? (
                                            selectedGroupMembers.map((member) => (
                                                <button
                                                    key={member.id}
                                                    type="button"
                                                    className="group-member-chip"
                                                    onClick={() => toggleSelectedGroupMember(member)}
                                                >
                                                    {member.nickname || member.username || "User"} ×
                                                </button>
                                            ))
                                        ) : (
                                            <p className="text-secondary m-0">No members selected yet.</p>
                                        )}
                                    </div>

                                    <div className="group-search-wrap mb-3">
                                        <input
                                            type="text"
                                            className="form-control group-search-input"
                                            value={groupMemberSearch}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setGroupMemberSearch(value);
                                                if (!value.trim()) {
                                                    setGroupSearchResults([]);
                                                }
                                            }}
                                            placeholder="Search users..."
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    searchUsersForGroup();
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className={`btn group-search-btn d-flex justify-content-center align-items-center ${
                                                groupMemberSearch.trim() ? "is-active" : ""
                                            }`}
                                            onClick={searchUsersForGroup}
                                        >
                                            <Search size={18} />
                                        </button>
                                    </div>

                                    {groupMemberSearch.trim() ? (
                                        <>
                                            <h6 className="text-light">Search Results</h6>
                                            <div className="group-user-list">
                                                {groupSearchResults.length ? (
                                                    groupSearchResults.map((result) => {
                                                        const resultId = String(result?.id || "");
                                                        const isSelf = resultId === String(user?.id);
                                                        const isSelected = selectedGroupMembers.some(
                                                            (member) => String(member.id) === resultId
                                                        );
                                                        const alreadyInGroup =
                                                            groupFlowMode === "add-members" &&
                                                            currentGroupMemberIds.has(resultId);
                                                        if (!resultId || isSelf) return null;
                                                        return (
                                                            <div key={result.id} className="group-user-row">
                                                                <div className="d-flex align-items-center">
                                                                    {result?.profile_url ? (
                                                                        <img loading="lazy" src={resolveUrl(result.profile_url)} alt="user" className="avatar me-2" />
                                                                    ) : (
                                                                        <PersonCircle className="avatar me-2" />
                                                                    )}
                                                                    <span>{result?.nickname || result?.username || "Unknown"}</span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-info"
                                                                    disabled={alreadyInGroup}
                                                                    onClick={() => toggleSelectedGroupMember(result)}
                                                                >
                                                                    {alreadyInGroup
                                                                        ? "Already in group"
                                                                        : isSelected
                                                                            ? "Selected"
                                                                            : "Add"}
                                                                </button>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <p className="text-secondary m-0">Search for users</p>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <h6 className="text-light">Contacts</h6>
                                            <div className="group-user-list">
                                                {contacts.length ? (
                                                    contacts.map((entry) => {
                                                        const contact = entry?.contact;
                                                        const contactId = String(contact?.id || "");
                                                        const isSelected = selectedGroupMembers.some(
                                                            (member) => String(member.id) === contactId
                                                        );
                                                        const alreadyInGroup =
                                                            groupFlowMode === "add-members" &&
                                                            currentGroupMemberIds.has(contactId);
                                                        if (!contactId) return null;
                                                        return (
                                                            <div key={entry.id} className="group-user-row">
                                                                <div className="d-flex align-items-center">
                                                                    {contact?.profile_url ? (
                                                                        <img loading="lazy" src={resolveUrl(contact.profile_url)} alt="contact" className="avatar me-2" />
                                                                    ) : (
                                                                        <PersonCircle className="avatar me-2" />
                                                                    )}
                                                                    <span>{contact?.nickname || "Unknown"}</span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-info"
                                                                    disabled={alreadyInGroup}
                                                                    onClick={() => toggleSelectedGroupMember(contact)}
                                                                >
                                                                    {alreadyInGroup
                                                                        ? "Already in group"
                                                                        : isSelected
                                                                            ? "Selected"
                                                                            : "Add"}
                                                                </button>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <p className="text-secondary">No contacts yet.</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        disabled={isGroupSubmitting}
                                        onClick={submitGroupFlow}
                                    >
                                        {isGroupSubmitting
                                            ? "Saving..."
                                            : groupFlowMode === "add-members"
                                                ? "Add Members"
                                                : "Create Group"}
                                    </button>
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
                                                        <img loading="lazy" className="avatar me-3" src={profilePreview} alt="Profile" style={{width: "80px" ,height:"80px"}} id="selectedAvatar"/>
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
                                    <div className="container">
                                        <div className="row">
                                            <div className="col-1 me-4">
                                                <InfoCircle style={{width:"30px" ,height:"30px"}}/>
                                            </div>
                                            <div className="col-8">
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
                                                    <img loading="lazy" id="selectedBackground"
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
                                        <button type="button" className="btn btn-secondary d-flex align-items-center justify-content-center rounded-2 ms-0" style={{width:"35px",height:"35px"}}>
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
                                                <img loading="lazy" className="avatar me-2" src={resolveUrl(user.profile_url)} />
                                                :
                                                <PersonCircle size={40} className="border border-white rounded-circle me-2"/>
                                            }
                                            {user?.nickname}
                                        </h5>
                                    </a>
                                    <a
                                        className="btn text-white d-flex justify-content-start mt-1 account-control-button"
                                        role="button"
                                        data-bs-toggle="modal"
                                        data-bs-target="#contacts-modal"
                                    >
                                        <h5 className="ms-2 d-flex justify-content-center align-items-center">
                                            <Person size={40} className="border border-white rounded-circle me-2"/>
                                            Contacts
                                        </h5>
                                    </a>
                                    <a
                                        className="btn text-white d-flex justify-content-start mt-1 account-control-button"
                                        role="button"
                                        data-bs-toggle="modal"
                                        data-bs-target="#groupCreateModal"
                                        onClick={openCreateGroupFlow}
                                    >
                                        <h5 className="ms-2 d-flex justify-content-center align-items-center">
                                            <PeopleFill size={40} className="border border-white rounded-circle me-2" />
                                            Create Group
                                        </h5>
                                    </a>
                                </div>
                            </div>
                            <div className="modal fade" id="contacts-modal" aria-hidden="true" tabIndex={-1}>
                                <div className="modal-dialog modal-dialog-centered modal-fullscreen-md-down">
                                    <div className="modal-content theme-gray">
                                        <div className="modal-header">
                                            <h1 className="modal-title fs-5">Contacts</h1>
                                            <button
                                                type="button"
                                                className="btn-close btn-close-white"
                                                data-bs-dismiss="modal"
                                                aria-label="Close"
                                            />
                                        </div>
                                        <div className="modal-body">
                                            {isLoadingContacts ? (
                                                <p>Loading contacts...</p>
                                            ) : contacts.length ? (
                                                contacts.map((entry) => (
                                                    <div
                                                        key={entry.id}
                                                        className="d-flex justify-content-between align-items-center mb-3"
                                                    >
                                                        <div className="d-flex align-items-center">
                                                            {entry?.contact?.profile_url ? (
                                                                <img loading="lazy" className="avatar me-2"
                                                                    src={resolveUrl(entry.contact.profile_url)}
                                                                    alt="contact"
                                                                />
                                                            ) : (
                                                                <PersonCircle className="avatar me-2" />
                                                            )}
                                                            <span>{entry?.contact?.nickname || "Unknown"}</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="contact-modal-remove-btn p-2"
                                                            disabled={isContactActionLoading}
                                                            onClick={() => removeFromContacts(entry?.contact?.id)}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <p>No contacts yet.</p>
                                            )}
                                        </div>
                                    </div>
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
                                                <img loading="lazy" className="m-0" src={resolveUrl(searchResult.profile_url)} />
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
                                        <img loading="lazy" className="m-0" src={resolveUrl(conversation.profile_url)} />
                                        ) : (
                                        <People size={35} className="border border-white rounded-circle" />
                                        )}
                                        <div className="chat-item-meta ms-2">
                                            <div className="chat-item-name-row">
                                                <span className="chat-item-name">{conversation?.name}</span>
                                                {Number(conversation?.unread_count || 0) > 0 ? (
                                                    <span className="chat-unread-badge">
                                                        {conversation.unread_count}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="chat-item-preview">
                                                {buildLastMessagePreview(conversation)}
                                            </div>
                                        </div>
                                    </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Chat content */}
                        <div className="chat-content" id="chatContent" style={{ backgroundImage: `url(${user?.background_image_url ? resolveUrl(user.background_image_url) : "https://res.cloudinary.com/dwfngrwoe/image/upload/v1758392790/default_hgh8gm.webp"})`}}>
                            {chatName ? 
                            <div className="chat-header">
                                {/* Group modal button */}
                                <button id="backBtn" onClick={backToChats}>←</button>
                                <div className="chat-header-main" type="button" data-bs-toggle="modal" data-bs-target={currentConversationIsGroup ? "#groupModal" : "#private-user-modal"} onClick={getmembers}>
                                    {chatImg ? 
                                        <img loading="lazy" src={resolveUrl(chatImg)} alt="Profile" id="chatHeaderImg" className="m-0" />
                                        :
                                        <People size={35} className="border border-white rounded-circle"/>
                                    }
                                    
                                    <span id="chatName" className="ms-2">{chatName}</span>
                                </div>
                                {canManageGroup ? (
                                    <div className="dropdown ms-auto">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-light group-manage-btn"
                                            data-bs-toggle="dropdown"
                                            aria-expanded="false"
                                        >
                                            <ThreeDotsVertical size={18} />
                                        </button>
                                        <ul className="dropdown-menu dropdown-menu-end">
                                            <li>
                                                <button
                                                    type="button"
                                                    className="dropdown-item"
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#groupMembersModal"
                                                    onClick={openAddMembersFlow}
                                                >
                                                    Add Members
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                ) : null}
                            </div>
                            :
                            <div/>
                            }
                            <div className="messages">
                                {liveMessage?.map((message) => {
                                    const replyTarget = resolveReplyTarget(message);
                                    const isMyMessage = user.id === message.sender.id;
                                    const isDraggingThis =
                                        dragVisual.messageId === message.id && dragStartRef.current.active;

                                    return isMyMessage ? (
                                        <div className="message sent" key={message.id}>
                                            {message.sender.profile_url ? (
                                                <a role="button" data-bs-toggle="modal" data-bs-target={`#${message.sender.id}`}>
                                                    <img loading="lazy" src={resolveUrl(message.sender.profile_url)} className="avatar"   />
                                                </a>
                                            ) : (
                                                <a role="button" data-bs-toggle="modal" data-bs-target={`#${message.sender.id}`}>
                                                    <PersonCircle className="avatar" />
                                                </a>
                                            )}
                                            <div
                                                className={`message-bubble ${isDraggingThis ? "swiping" : ""}`}
                                                style={{
                                                    transform: isDraggingThis
                                                        ? `translateX(${dragVisual.offsetX}px)`
                                                        : "translateX(0)",
                                                }}
                                                onPointerDown={(e) => onDragReplyStart(e, message)}
                                                onPointerMove={onDragReplyMove}
                                                onPointerUp={onDragReplyEnd}
                                                onPointerCancel={onDragReplyCancel}
                                            >
                                                    {replyTarget && (
                                                        <div className="reply-preview">
                                                            <div className="reply-nickname">
                                                                {replyTarget?.sender?.nickname || "Unknown"}
                                                            </div>
                                                            <div className="reply-content">
                                                                {truncatePreviewText(replyTarget?.content, 60)}
                                                            </div>
                                                        </div>
                                                    )}
                                                <div className="message-header">
                                                    <span className="nickname">{message?.sender.nickname}</span>
                                                    <span className="time">{prettyDate(message?.created_at)}</span>
                                                </div>
                                                <div
                                                    className="message-content"
                                                    onClick={(e) => openReplyMenu(e, message)}
                                                >
                                                    {message?.content}
                                                </div>
                                                {message?.media_files?.length ? (
                                                    <div className="message-media-list">
                                                        {message.media_files.map((media) => {
                                                            const mediaUrl = media?.url || media?.file;
                                                            const mediaKind = media?.kind;
                                                            if (!mediaUrl) return null;
                                                            if (mediaKind === "image" || isImageMedia(mediaUrl)) {
                                                                return (
                                                                    <button
                                                                        type="button"
                                                                        className="message-media-image-btn"
                                                                        key={media.id || mediaUrl}
                                                                        onClick={() => openFullscreenImage(mediaUrl)}
                                                                    >
                                                                        <img loading="lazy" src={resolveUrl(mediaUrl)} alt="attachment" className="message-media-preview" />
                                                                    </button>
                                                                );
                                                            }
                                                            if (mediaKind === "video" || isVideoMedia(mediaUrl)) {
                                                                return (
                                                                    <button
                                                                        type="button"
                                                                        className="message-media-image-btn"
                                                                        key={media.id || mediaUrl}
                                                                        onClick={() => openFullscreenVideo(mediaUrl)}
                                                                    >
                                                                        <video className="message-media-preview" muted>
                                                                            <source src={resolveUrl(mediaUrl)} />
                                                                        </video>
                                                                    </button>
                                                                );
                                                            }
                                                            return (
                                                                <a
                                                                    href={mediaUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    key={media.id || mediaUrl}
                                                                    className="message-media-file"
                                                                >
                                                                    {getMediaDisplayName(media, mediaUrl)}
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                ) : null}
                                                {message?.upload_status ? (
                                                    <div
                                                        className={`upload-status ${
                                                            message.upload_status === "Upload failed" ? "error" : ""
                                                        }`}
                                                    >
                                                        {message.upload_status}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="message received" key={message.id}>
                                            {message.sender.profile_url ? (
                                                <img loading="lazy" src={resolveUrl(message.sender.profile_url)} className="avatar" />
                                            ) : (
                                                <PersonCircle size={35} />
                                            )}
                                            <div
                                                className={`message-bubble ${isDraggingThis ? "swiping" : ""}`}
                                                style={{
                                                    transform: isDraggingThis
                                                        ? `translateX(${dragVisual.offsetX}px)`
                                                        : "translateX(0)",
                                                }}
                                                onPointerDown={(e) => onDragReplyStart(e, message)}
                                                onPointerMove={onDragReplyMove}
                                                onPointerUp={onDragReplyEnd}
                                                onPointerCancel={onDragReplyCancel}
                                            >
                                                {replyTarget && (
                                                    <div className="reply-preview">
                                                            <div className="reply-nickname">
                                                                {replyTarget?.sender?.nickname || "Unknown"}
                                                            </div>
                                                            <div className="reply-content">
                                                                {truncatePreviewText(replyTarget?.content, 60)}
                                                            </div>
                                                        </div>
                                                    )}
                                                <div className="message-header">
                                                    <span className="nickname">{message?.sender.nickname}</span>
                                                    <span className="time">{prettyDate(message?.created_at)}</span>
                                                </div>
                                                <div
                                                    className="message-content"
                                                    onClick={(e) => openReplyMenu(e, message)}
                                                >
                                                    {message?.content}
                                                </div>
                                                {message?.media_files?.length ? (
                                                    <div className="message-media-list">
                                                        {message.media_files.map((media) => {
                                                            const mediaUrl = media?.url || media?.file;
                                                            const mediaKind = media?.kind;
                                                            if (!mediaUrl) return null;
                                                            if (mediaKind === "image" || isImageMedia(mediaUrl)) {
                                                                return (
                                                                    <button
                                                                        type="button"
                                                                        className="message-media-image-btn"
                                                                        key={media.id || mediaUrl}
                                                                        onClick={() => openFullscreenImage(mediaUrl)}
                                                                    >
                                                                        <img loading="lazy" src={resolveUrl(mediaUrl)} alt="attachment" className="message-media-preview" />
                                                                    </button>
                                                                );
                                                            }
                                                            if (mediaKind === "video" || isVideoMedia(mediaUrl)) {
                                                                return (
                                                                    <button
                                                                        type="button"
                                                                        className="message-media-image-btn"
                                                                        key={media.id || mediaUrl}
                                                                        onClick={() => openFullscreenVideo(mediaUrl)}
                                                                    >
                                                                        <video className="message-media-preview" muted>
                                                                            <source src={resolveUrl(mediaUrl)} />
                                                                        </video>
                                                                    </button>
                                                                );
                                                            }
                                                            return (
                                                                <a
                                                                    href={mediaUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    key={media.id || mediaUrl}
                                                                    className="message-media-file"
                                                                >
                                                                    {getMediaDisplayName(media, mediaUrl)}
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                ) : null}
                                                {message?.upload_status ? (
                                                    <div
                                                        className={`upload-status ${
                                                            message.upload_status === "Upload failed" ? "error" : ""
                                                        }`}
                                                    >
                                                        {message.upload_status}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}
                                    <div ref={messagesEndRef} />
                            </div>
                            {replyMenu.visible && (
                                <div
                                    className="message-action-menu"
                                    style={{ left: `${replyMenu.x}px`, top: `${replyMenu.y}px` }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        type="button"
                                        className="message-action-item"
                                        onClick={() => startReply(messagesById.get(String(replyMenu.messageId)))}
                                    >
                                        Reply
                                    </button>
                                </div>
                            )}
                            {uuid ? (
                                <>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="d-none"
                                multiple
                                onChange={handleAttachmentSelection}
                            />
                            {attachmentModalOpen && (
                                <div
                                    className="attachment-modal-backdrop"
                                    onClick={() => {
                                        if (!isUploadingAttachments) {
                                            closeAttachmentModal();
                                        }
                                    }}
                                >
                                    <div className="attachment-modal" onClick={(e) => e.stopPropagation()}>
                                        <div className="attachment-modal-header">
                                            <h5 className="m-0">Send Attachments</h5>
                                            <button
                                                type="button"
                                                className="attachment-close-btn"
                                                onClick={closeAttachmentModal}
                                                disabled={isUploadingAttachments}
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <div className="attachment-list">
                                            {selectedAttachments.map((item) => (
                                                <div className="attachment-item" key={item.id}>
                                                    <div className="attachment-preview-wrap">
                                                        {item.kind === "image" && item.previewUrl ? (
                                                            <img loading="lazy" src={item.previewUrl}
                                                                alt={item.file.name}
                                                                className="attachment-preview"
                                                            />
                                                        ) : null}
                                                        {item.kind === "video" && item.previewUrl ? (
                                                            <video
                                                                src={item.previewUrl}
                                                                className="attachment-preview"
                                                                controls
                                                            />
                                                        ) : null}
                                                        {item.kind === "file" ? (
                                                            <div className="attachment-file-pill">FILE</div>
                                                        ) : null}
                                                    </div>
                                                    <div className="attachment-meta">
                                                        <div className="attachment-name">{item.file.name}</div>
                                                        <div className="attachment-size">
                                                            {formatBytes(item.file.size)}
                                                        </div>
                                                        <div className="attachment-progress-line">
                                                            <div
                                                                className={`attachment-progress-fill ${
                                                                    item.status === "error" ? "is-error" : ""
                                                                }`}
                                                                style={{ width: `${item.progress}%` }}
                                                            />
                                                        </div>
                                                        <div className="attachment-status-text">
                                                            {item.status === "uploaded"
                                                                ? "Uploaded"
                                                                : item.status === "error"
                                                                    ? item.error
                                                                    : item.status === "uploading"
                                                                        ? `Uploading ${item.progress}%`
                                                                        : "Pending"}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="attachment-remove-btn"
                                                        onClick={() => removeAttachment(item.id)}
                                                        disabled={isUploadingAttachments}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="attachment-footer">
                                            <textarea
                                                className="attachment-text-input"
                                                placeholder="Add a message..."
                                                value={attachmentText}
                                                onChange={(e) => setAttachmentText(e.target.value)}
                                                disabled={isUploadingAttachments}
                                            />
                                            <div className="attachment-overall-progress">
                                                <div className="attachment-overall-line">
                                                    <div
                                                        className="attachment-overall-fill"
                                                        style={{ width: `${totalUploadProgress}%` }}
                                                    />
                                                </div>
                                                <span>{totalUploadProgress}%</span>
                                            </div>
                                            <div className="attachment-footer-actions">
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    onClick={openAttachmentPicker}
                                                    disabled={isUploadingAttachments}
                                                >
                                                    Add more
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    onClick={uploadSelectedAttachments}
                                                    disabled={!selectedAttachments.length || isUploadingAttachments}
                                                >
                                                    {isUploadingAttachments ? "Uploading..." : "Send files"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <form className="chat-input" onSubmit={(e) => {
                                    e.preventDefault();
                                    if (sendMessage()) {
                                    setContent("");
                                    }
                                    const textarea = e.target.querySelector("textarea");
                                    if (textarea) textarea.focus();
                                    }}>
                                        {replyingTo && (
                                            <div className="replying-to-bar">
                                                <div className="replying-to-text">
                                                    <span className="replying-to-name">
                                                        {replyingTo?.sender?.nickname || "Unknown"}
                                                    </span>
                                                    <span>{truncatePreviewText(replyingTo?.content, 60)}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="replying-to-close"
                                                    onClick={() => setReplyingTo(null)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        )}
                                        <div className="chat-input-row">
                                        <textarea
                                        ref={textareaRef}
                                        placeholder="Type a message..."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            e.currentTarget.form?.requestSubmit();
                                            }
                                        }}
                                        />

                                        <div
                                        className="d-flex justify-content-center align-items-center"
                                        style={{ backgroundColor: "#1b1d20" }}
                                        >
                                        <button
                                            type="button"
                                            className="btn btn-secondary d-flex justify-content-center align-items-center rounded-pill me-2"
                                            style={{ width: "50px", height: "35px" }}
                                            onClick={openAttachmentPicker}
                                        >
                                            <Paperclip size={20} />
                                        </button>
                                        {content ? (
                                            <button
                                            type="submit"
                                            className="btn btn-primary d-flex justify-content-center align-items-center rounded-pill me-2"
                                            style={{ width: "50px", height: "35px" }}

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
