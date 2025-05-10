import React, { useEffect, useRef, useState, useContext } from "react";
import { useSocket } from "../../context/SocketContext";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./ChatPopup.css";

const ChatPopup = () => {
  const socket = useSocket();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const scrollRef = useRef();

  useEffect(() => {
    if (!socket || !user) return;
    socket.emit("join", user._id);
    socket.on("receiveMessage", (msg) => setChat((prev) => [...prev, msg]));
    return () => socket.off("receiveMessage");
  }, [socket, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleSend = () => {
    if (!message.trim()) return;
    const msg = {
      senderId: user._id,
      receiverId: "admin",
      text: message,
      createdAt: new Date(),
    };
    socket.emit("sendMessage", msg);
    setChat((prev) => [...prev, msg]);
    setMessage("");
  };

  const handleToggleChat = () => {
    if (!user) {
      alert("Vui lòng đăng nhập để sử dụng chức năng chat.");
      navigate("/login");
      return;
    }
    setOpen(!open);
  };

  return (
    <div className="chat-popup-wrapper">
      {open && (
        <div className="chat-box shadow">
          <div className="chat-header bg-primary text-white p-2 d-flex justify-content-between">
            <span>💬 Hỗ trợ trực tuyến</span>
            <button className="btn-close btn-close-white" onClick={() => setOpen(false)}></button>
          </div>
          <div className="chat-body p-2">
            {chat.map((msg, idx) => (
              <div
                key={idx}
                className={`chat-message ${msg.senderId === user._id ? "user" : "admin"}`}
                ref={idx === chat.length - 1 ? scrollRef : null}
              >
                <span>{msg.text}</span>
              </div>
            ))}
          </div>
          <div className="chat-input p-2 border-top d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Nhập tin nhắn..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button className="btn btn-primary" onClick={handleSend}>Gửi</button>
          </div>
        </div>
      )}
      <button className="btn btn-primary chat-toggle" onClick={handleToggleChat}>
        <i className="ri-message-3-line fs-5"></i>
      </button>
    </div>
  );
};

export default ChatPopup;
