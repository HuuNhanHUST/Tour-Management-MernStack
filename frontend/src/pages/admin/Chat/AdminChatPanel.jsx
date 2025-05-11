import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../context/AuthContext";
import { useSocket } from "../../../context/SocketContext";

const AdminChatPanel = () => {
  const { user } = useContext(AuthContext);
  const socket = useSocket();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (socket) socket.emit("addUser", user._id); // ✅ admin dùng _id thực
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
        setChat(res.data || []);
      } catch (err) {
        console.error("Lỗi khi lấy lịch sử chat:", err);
      }
    };
    fetchMessages();
  }, [selectedUser]);

  useEffect(() => {
    if (!socket) return;
    socket.on("receiveMessage", (data) => {
      if (
        selectedUser &&
        (data.senderId === selectedUser._id || data.receiverId === selectedUser._id)
      ) {
        setChat((prev) => [...prev, data]);
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

  return (
    <div style={{ display: "flex", gap: "20px", padding: "20px" }}>
      {/* Danh sách user */}
      <div>
        <h4>Người dùng</h4>
        <ul>
          {users.map((u) => (
            <li
              key={u._id}
              onClick={() => setSelectedUser(u)}
              style={{
                cursor: "pointer",
                marginBottom: "8px",
                fontWeight: selectedUser?._id === u._id ? "bold" : "normal",
              }}
            >
              {u.fullName || u.email}
            </li>
          ))}
        </ul>
      </div>

      {/* Hộp thoại chat */}
      <div>
        <h4>Lịch sử trò chuyện</h4>
        {selectedUser ? (
          <div>
            <p>
              <strong>Đang trò chuyện với:</strong> {selectedUser.fullName || selectedUser.email}
            </p>
            <div
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                width: "500px",
                height: "300px",
                overflowY: "auto",
                backgroundColor: "#f9f9f9",
              }}
            >
              {chat.map((msg, index) => (
                <p key={index}>
                  <strong>
                    {String(msg.senderId) === String(user._id) ? "Admin" : "User"}:
                  </strong>{" "}
                  {msg.text}
                </p>
              ))}
            </div>

            <div style={{ marginTop: "10px" }}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                style={{ width: "350px", marginRight: "10px" }}
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
