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

  // 🟨 Lấy lịch sử tin nhắn
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

  // ✅ Gửi tin nhắn
  const handleSend = async () => {
    if (!socket || !message.trim()) return;

    const msg = {
      senderId: user._id,
      receiverId: "admin",
      text: message,
      createdAt: new Date(),
    };

    socket.emit("sendMessage", msg);
    setChat((prev) => [...prev, msg]);
    setMessage("");

    try {
     await axios.post("http://localhost:4000/api/v1/chat/send", {
  receiverId: "admin",
  text: msg.text, // ✅ phải là "text"
}, { withCredentials: true });
    } catch (err) {
      console.error("❌ Lỗi lưu tin nhắn:", err.message);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  // ✅ Realtime: nhận tin nhắn
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit("addUser", user._id);

    socket.on("receiveMessage", (msg) => {
      if (
        (msg.senderId === "admin" && msg.receiverId === user._id) ||
        (msg.senderId === user._id && msg.receiverId === "admin")
      ) {
        setChat((prev) => [...prev, msg]);
        if (!open) setHasNewMessage(true); // 🔴 Chỉ khi đang đóng chat
      }
    });

    return () => socket.off("receiveMessage");
  }, [socket, user, open]);

  // ✅ Reset badge khi mở chat
  useEffect(() => {
    if (open) {
      setHasNewMessage(false);
    }
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
                className={`chat-message ${msg.senderId === user._id ? "me" : "you"}`}
              >
                <div className="chat-bubble">{msg.text}</div>
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