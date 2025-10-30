import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import "./ChatPopup.css";

const ChatPopup = () => {
  const { user } = useContext(AuthContext);
  const socket = useSocket();

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const bottomRef = useRef(null);
  // ✅ FIX: Only define chatRoomId if user exists
  const chatRoomId = user ? user._id : null;

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const time = date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const day = date.toLocaleDateString("vi-VN");
    return `${time} - ${day}`;
  };

  useEffect(() => {
    if (!open || !chatRoomId) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/v1/chat/history/${chatRoomId}`, { withCredentials: true });
        setChat(res.data.data || []);
      } catch (err) {
        console.error("Lỗi lấy lịch sử chat:", err.message);
      }
    };

    fetchMessages();
  }, [open, chatRoomId]);

  const handleReceiveMessage = useCallback(
    (msg) => {
      if (msg.chatRoomId === chatRoomId) {
        // ✅ FIX: Skip own messages to prevent duplicates
        // Own messages are already added via API response
        if (user && String(msg.senderId) !== String(user._id)) {
          setChat((prev) => [...prev, msg]);
        }
        if (!open) setHasNewMessage(true);
      }
    },
    [chatRoomId, open, user?._id]
  );
  
  useEffect(() => {
    if (!socket || !chatRoomId) return;
    
    socket.emit("joinRoom", chatRoomId);
    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [socket, chatRoomId, handleReceiveMessage]);
  
  const handleSend = async () => {
    if (!message.trim()) return;

    const newMsg = {
      chatRoomId: chatRoomId, // Ensure chatRoomId is passed
      text: message,
    };

    try {
      const res = await axios.post("http://localhost:4000/api/v1/chat/send", newMsg, { withCredentials: true });
      const savedMessage = res.data.data;
      
      // ✅ Add message locally immediately for responsive UX
      setChat((prev) => [...prev, savedMessage]);
      
      // ✅ Emit to socket - will broadcast to other users only
      // (handleReceiveMessage skips own messages to prevent duplicates)
      socket.emit("sendMessage", savedMessage);
      
      setMessage("");
    } catch (err) {
      console.error("Lỗi lưu tin nhắn:", err.message);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  useEffect(() => {
    if (open) setHasNewMessage(false);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // ✅ CORRECT FIX: Check for user *after* all hooks have been called.
  if (!user) return null;

  return (
    <div className="chat-popup-wrapper">
      {open ? (
        <div className="chat-box shadow">
          <div className="chat-header bg-primary text-white d-flex justify-content-between align-items-center p-2">
            <span>💬 Hỗ trợ trực tuyến</span>
            <button className="btn btn-sm btn-light" onClick={() => setOpen(false)}>✖
            </button>
          </div>

          <div className="chat-body">
            {chat.map((msg, idx) => {
              const isMe = String(msg.senderId) === String(user._id);
              const isAdmin = msg.senderRole === "admin";

              return (
                <div key={idx} className={`chat-message ${isMe ? "me" : isAdmin ? "admin" : "you"}`}>
                  <div className="sender-name" style={{ fontWeight: "bold", fontSize: "0.85rem", marginBottom: "3px" }}>
                    {isMe ? "Bạn" : isAdmin ? "Admin" : "Khách"}
                  </div>
                  <div className="chat-bubble">
                    {msg.text}
                    <div className="msg-time">{formatTime(msg.createdAt)}</div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef}></div>
          </div>

          <div className="chat-input d-flex">
            <input
              type="text"
              className="form-control"
              placeholder="Nhập tin nhắn..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button className="btn btn-primary" onClick={handleSend}>
              Gửi
            </button>
          </div>
        </div>
      ) : (
        <button className="btn btn-primary chat-toggle-btn" onClick={() => setOpen(true)}>
          💬 Chat
          {hasNewMessage && <span className="chat-badge">●</span>}
        </button>
      )}
    </div>
  );
};

export default ChatPopup;
