import React, { useState, useEffect, useRef, useContext } from "react";
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

  // ✅ ID thực của admin từ database
  const ADMIN_ID = "6803343a6c0047c5fa9b60c6";

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
    const fetchMessages = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/v1/chat/history", {
          withCredentials: true,
        });
        if (res.data?.data) setChat(res.data.data);
      } catch (err) {
        console.error("❌ Lỗi lấy lịch sử:", err.message);
      }
    };

    if (open && user) fetchMessages();
  }, [open, user]);

  const handleSend = async () => {
    if (!socket || !message.trim()) return;

    const msg = {
      senderId: user._id,
      receiverId: ADMIN_ID,
      text: message,
      createdAt: new Date(),
    };

    socket.emit("sendMessage", msg);
    setChat((prev) => [...prev, msg]);
    setMessage("");

    try {
      await axios.post(
        "http://localhost:4000/api/v1/chat/send",
        { receiverId: ADMIN_ID, text: msg.text },
        { withCredentials: true }
      );
    } catch (err) {
      console.error("❌ Lỗi lưu tin nhắn:", err.message);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  useEffect(() => {
    if (!socket || !user) return;

    socket.emit("addUser", user._id);

    socket.on("receiveMessage", (msg) => {
      const isRelated =
        (String(msg.senderId) === ADMIN_ID && String(msg.receiverId) === String(user._id)) ||
        (String(msg.senderId) === String(user._id) && String(msg.receiverId) === ADMIN_ID);

      if (isRelated) {
        setChat((prev) => [...prev, msg]);
        if (!open) setHasNewMessage(true);
      }
    });

    return () => socket.off("receiveMessage");
  }, [socket, user, open]);

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
          <div className="chat-header bg-primary text-white d-flex justify-content-between p-2">
<span>💬 Hỗ trợ trực tuyến</span>
            <button className="btn btn-sm btn-light" onClick={() => setOpen(false)}>✖</button>
          </div>
          <div className="chat-body">
            {chat.map((msg, idx) => (
              <div
                key={idx}
                className={`chat-message ${String(msg.senderId) === String(user._id) ? "me" : "you"}`}
              >
                <div className="chat-bubble">
                  {msg.text}
                  <div className="msg-time">{formatTime(msg.createdAt)}</div>
                </div>
              </div>
            ))}
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
            <button className="btn btn-primary" onClick={handleSend}>Gửi</button>
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