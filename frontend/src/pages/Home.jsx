import { useState, useEffect } from "react";
import HomeComponent from "../components/HomeComponent";
import { useParams } from "react-router-dom";
import api from "../api"; 
import { uploadWithTus } from "../tusUpload";



function Home() {
    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState();
    const [conversationIds, setConversationsIds] = useState();
    const [isSuccess, setIsSuccess] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [messages, setMessages] = useState();
    const [messagesPagination, setMessagesPagination] = useState({
        hasMore: false,
        nextPage: null,
        isLoading: false,
    });
    const { uuid } = useParams();

    useEffect(() => {
        fetchdata();
    }, []);

    useEffect(() => {
        fetchmessages(1, false); 
    }, [uuid, user?.id]);

    const mediaBaseUrl = (import.meta.env.VITE_MEDIA_BASE_URL || "").replace(/\/+$/, "");

    const fetchdata = async () => {
        await api
            .get("/chat/",{ withCredentials: true })
            .then((res) => res.data)
            .then((data) => {
                setUser(data.user);
                setConversations(data.conversations);
                setConversationsIds(data.conversationIds)
            })
            
            .catch((err) => alert(err));
    };

    const uploadFileToTus = (file, { category, allowResume = true, onProgress }) =>
        new Promise((resolve, reject) => {
            uploadWithTus(file, {
                category,
                allowResume,
                onProgress: ({ uploaded, total }) => {
                    if (onProgress && total) onProgress(uploaded, total);
                },
                onSuccess: ({ uploadUrl }) => resolve(uploadUrl),
                onError: (err) => reject(err),
            });
        });

    const extractTusUploadId = (uploadUrl) => {
        if (!uploadUrl || typeof uploadUrl !== "string") return "";
        const cleanUrl = uploadUrl.split("?")[0].replace(/\/+$/, "");
        return cleanUrl.split("/").pop() || "";
    };

    const waitForMediaFile = async (url, timeoutMs = 90000) => {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            try {
                const res = await fetch(url, { method: "HEAD", cache: "no-store" });
                if (res.ok) return true;
            } catch {
                // Keep polling while conversion finishes.
            }
            await new Promise((r) => setTimeout(r, 1000));
        }
        return false;
    };

    const UserUpdateSubmit = async (data) => {
        try {
            let profileUrl = data.profile;
            let backgroundUrl = data.background_image;

            const files = [];
            if (data.profile instanceof File) {
                files.push({ key: "profile", file: data.profile });
            }
            if (data.background_image instanceof File) {
                files.push({ key: "background_image", file: data.background_image });
            }

            const totalBytes = files.reduce((sum, item) => sum + (item.file.size || 0), 0);
            let uploadedBytes = 0;

            for (const item of files) {
                let lastUploaded = 0;
                const category = item.key === "profile" ? "profile" : "background";
                const folder = item.key === "profile" ? "profiles" : "backgrounds";
                const uploadUrl = await uploadFileToTus(item.file, {
                    category,
                    allowResume: false,
                    onProgress: (uploaded, total) => {
                        const delta = uploaded - lastUploaded;
                        lastUploaded = uploaded;
                        uploadedBytes += Math.max(0, delta);
                        if (totalBytes > 0) {
                            setUploadProgress(Math.round((uploadedBytes / totalBytes) * 100));
                        }
                    },
                });
                const uploadId = extractTusUploadId(uploadUrl);
                if (!uploadId) {
                    throw new Error("Could not resolve uploaded file id from tus URL.");
                }
                const finalUrl = `${mediaBaseUrl}/media/${folder}/${uploadId}.webp`;
                const isReady = await waitForMediaFile(finalUrl, 90000);
                if (!isReady) {
                    throw new Error(`Conversion timed out for ${item.key}. Please retry with a smaller file.`);
                }
                if (item.key === "profile") {
                    profileUrl = finalUrl;
                } else if (item.key === "background_image") {
                    backgroundUrl = finalUrl;
                }
            }

            const payload = {};
            Object.entries(data).forEach(([key, value]) => {
                if (key !== "profile" && key !== "background_image" && value !== undefined && value !== null) {
                    payload[key] = value;
                }
            });
            if (typeof profileUrl === "string" && profileUrl) payload.profile = profileUrl;
            if (typeof backgroundUrl === "string" && backgroundUrl) payload.background_image = backgroundUrl;

            api.patch("user/profile/", payload)
                .then((res) => {
                if (res.status === 200) {
                    alert("Profile updated successfully!");
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

    const fetchmessages = async (page = 1, appendOlder = false) => {
        if (!uuid || !user) return;
        if (messagesPagination.isLoading) return;

        setMessagesPagination((prev) => ({ ...prev, isLoading: true }));
        try {
            const { data } = await api.get(`/chat/${uuid}/?page=${page}`);
            const incoming = Array.isArray(data?.messages) ? data.messages : [];
            const pagination = data?.pagination || {};

            setMessages((prev) => {
                if (!appendOlder || !Array.isArray(prev)) {
                    return incoming;
                }
                const seen = new Set(prev.map((msg) => String(msg.id)));
                const uniqueIncoming = incoming.filter((msg) => !seen.has(String(msg.id)));
                return [...uniqueIncoming, ...prev];
            });

            setMessagesPagination({
                hasMore: Boolean(pagination.has_more),
                nextPage: pagination.next_page || null,
                isLoading: false,
            });
        } catch (err) {
            setMessagesPagination((prev) => ({ ...prev, isLoading: false }));
            alert(err);
        }
    };

    const loadOlderMessages = async () => {
        if (!messagesPagination.hasMore || !messagesPagination.nextPage) return;
        await fetchmessages(messagesPagination.nextPage, true);
    };

    return (
        <HomeComponent
            user={user}
            conversations={conversations}
            conversationIds={conversationIds}
            messages={messages}
            uuid={uuid}
            UserUpdateSubmit={UserUpdateSubmit}
            uploadProgress={uploadProgress}
            uploadIsSuccess={isSuccess}
            hasMoreMessages={messagesPagination.hasMore}
            isLoadingOlderMessages={messagesPagination.isLoading}
            loadOlderMessages={loadOlderMessages}
        /> 
    );
}

export default Home
