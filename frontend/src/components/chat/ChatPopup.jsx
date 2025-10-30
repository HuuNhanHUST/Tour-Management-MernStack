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
  const [isTyping, setIsTyping] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);

  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatRoomId = user?._id;

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
    if (!open || !user) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/v1/chat/history/${chatRoomId}`, { withCredentials: true });
        setChat(res.data.data || []);
      } catch (err) {
        console.error("Lỗi lấy lịch sử chat:", err.message);
      }
    };

    fetchMessages();
  }, [open, user, chatRoomId]);

  const handleReceiveMessage = useCallback(
    (msg) => {
      if (msg.chatRoomId === chatRoomId) {
        // ✅ FIX: Skip own messages to prevent duplicates
        // Own messages are already added via API response
        if (String(msg.senderId) !== String(user?._id)) {
          setChat((prev) => [...prev, msg]);
        }
        if (!open) setHasNewMessage(true);
      }
    },
    [chatRoomId, open, user?._id]
  );

  useEffect(() => {
    if (!socket || !user) return;

    socket.emit("joinRoom", chatRoomId);
    socket.on("receiveMessage", handleReceiveMessage);

    // Listen for typing indicators
    socket.on("userTyping", ({ userId }) => {
      // Check if typing user is admin (not current user)
      if (userId !== user._id) {
        setIsTyping(true);
      }
    });

    socket.on("userStoppedTyping", ({ userId }) => {
      if (userId !== user._id) {
        setIsTyping(false);
      }
    });

    // Listen for admin online status
    socket.on("userStatusUpdate", ({ userId, isOnline }) => {
      // Check if admin is online (you can add admin ID check here)
      setAdminOnline(isOnline);
    });

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("userTyping");
      socket.off("userStoppedTyping");
      socket.off("userStatusUpdate");
    };
  }, [socket, user, chatRoomId, handleReceiveMessage]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const newMsg = {
      chatRoomId,
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

  const handleTyping = (e) => {
    setMessage(e.target.value);

    // Emit typing event
    if (socket && e.target.value.trim()) {
      socket.emit("typing", { 
        chatRoomId, 
        userId: user._id, 
        username: user.username 
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { chatRoomId, userId: user._id });
      }, 2000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
      // Stop typing indicator when message sent
      if (socket && typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        socket.emit("stopTyping", { chatRoomId, userId: user._id });
      }
    }
  };

  useEffect(() => {
    if (open) setHasNewMessage(false);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  if (!user) return null;

  return (
    <div className="chat-popup-wrapper">
      {open ? (
        <div className="chat-box shadow">
          <div className="chat-header text-white d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: "1.1rem", fontWeight: 600 }}>💬 Hỗ trợ trực tuyến</span>
              {adminOnline && (
                <span style={{ 
                  display: "inline-block", 
                  width: "8px", 
                  height: "8px", 
                  borderRadius: "50%", 
                  background: "#4ade80",
                  boxShadow: "0 0 8px #4ade80",
                  animation: "pulse 2s infinite"
                }} title="Admin đang online"></span>
              )}
            </div>
            <button className="btn btn-sm btn-light" onClick={() => setOpen(false)}>✖
            </button>
          </div>

          <div className="chat-body">
            {chat.map((msg, idx) => {
              const isMe = String(msg.senderId) === String(user?._id);
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
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
            
            <div ref={bottomRef}></div>
          </div>

          <div className="chat-input d-flex">
            <input
              type="text"
              className="form-control"
              placeholder="Nhập tin nhắn..."
              value={message}
              onChange={handleTyping}
              onKeyDown={handleKeyPress}
            />
            <button className="btn btn-primary" onClick={handleSend}>
              <i className="ri-send-plane-fill"></i>
            </button>
          </div>
        </div>
      ) : (
        <button className="chat-toggle-btn" onClick={() => setOpen(true)}>
          💬
          {hasNewMessage && <span className="chat-badge">!</span>}
        </button>
      )}
    </div>
  );
};

export default ChatPopup;
