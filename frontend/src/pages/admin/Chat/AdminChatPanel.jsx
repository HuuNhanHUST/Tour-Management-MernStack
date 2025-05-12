import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../context/AuthContext";
import { useSocket } from "../../../context/SocketContext";
import "./AdminChatPanel.css";

const AdminChatPanel = () => {
  const { user } = useContext(AuthContext);
  const socket = useSocket();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({}); // ✅ NEW

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
    if (socket && user) {
      socket.emit("addUser", user._id);
    }
  }, [socket, user]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/v1/chat/users", {
          withCredentials: true,
        });
        setUsers(res.data.data || []);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách người dùng:", err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `http://localhost:4000/api/v1/chat/admin/${selectedUser._id}`,
          { withCredentials: true }
        );
        setChat(res.data?.data || []);
      } catch (err) {
        console.error("Lỗi khi lấy lịch sử chat:", err);
      }
    };
    fetchMessages();
  }, [selectedUser]);

  useEffect(() => {
    if (!socket) return;

    socket.on("receiveMessage", (data) => {
      const senderId = String(data.senderId);
      const receiverId = String(data.receiverId);

      if (
        selectedUser &&
        (senderId === selectedUser._id || receiverId === selectedUser._id)
      ) {
        setChat((prev) => [...prev, data]);
      } else {
        // ✅ Tăng số chưa đọc nếu không phải người đang được chọn
        setUnreadCounts((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1,
        }));
      }
    });

    return () => socket.off("receiveMessage");
  }, [socket, selectedUser]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedUser) return;

    const newMsg = {
      receiverId: selectedUser._id,
      text: message,
    };

    try {
      const res = await axios.post("http://localhost:4000/api/v1/chat/send", newMsg, {
        withCredentials: true,
      });

      const savedMessage = res.data.data;
      setChat((prev) => [...prev, savedMessage]);
      socket.emit("sendMessage", savedMessage);
      setMessage("");
    } catch (err) {
console.error("❌ Gửi tin nhắn thất bại:", err.response?.data || err.message);
    }
  };

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    setUnreadCounts((prev) => {
      const newCounts = { ...prev };
      delete newCounts[u._id];
      return newCounts;
    });
  };

  return (
    <div className="admin-chat-wrapper">
      <div className="user-list">
        <h4>Người dùng</h4>
        <ul>
          {users.map((u) => (
            <li
              key={u._id}
              onClick={() => handleSelectUser(u)}
              className={selectedUser?._id === u._id ? "active" : ""}
            >
              {u.fullName || u.email}
              {unreadCounts[u._id] && (
                <span className="unread-badge">{unreadCounts[u._id]}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="chat-box-area">
        <h4>Lịch sử trò chuyện</h4>
        {selectedUser ? (
          <div>
            <p><strong>Đang trò chuyện với:</strong> {selectedUser.fullName || selectedUser.email}</p>
            <div className="chat-history">
              {chat.map((msg, index) => {
                const isAdmin = String(msg.senderId) === String(user._id);
                return (
                  <div
                    key={index}
                    className={`message-row ${isAdmin ? "admin" : "user"}`}
                  >
                    <div className="message-bubble">
                      {msg.text}
                      <div className="msg-time">{formatTime(msg.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="chat-input-area">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
              />
              <button onClick={handleSendMessage}>Gửi</button>
            </div>
          </div>
        ) : (
          <p>Vui lòng chọn người dùng để xem lịch sử trò chuyện.</p>
        )}
      </div>
    </div>
  );
};

export default AdminChatPanel;
