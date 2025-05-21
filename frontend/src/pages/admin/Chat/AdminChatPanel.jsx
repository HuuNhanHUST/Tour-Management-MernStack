import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../../../context/AuthContext";
import { useSocket } from "../../../context/SocketContext";
import "./AdminChatPanel.css";

const AdminChatPanel = () => {
  const { user } = useContext(AuthContext);
  const socket = useSocket();

  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) +
           " - " + d.toLocaleDateString("vi-VN");
  };

  useEffect(() => {
    if (socket && user) {
      socket.emit("addUser", user._id);
    }
  }, [socket, user]);

  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/v1/chat/chatrooms", { withCredentials: true });
        const rooms = res.data.data || [];
        setChatRooms(rooms);
        if (rooms.length > 0) setSelectedRoom(rooms[0]._id);
      } catch (err) {
        console.error("Lỗi lấy danh sách chatRooms:", err);
      }
    };
    fetchChatRooms();
  }, []);

  useEffect(() => {
    if (!selectedRoom) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/v1/chat/history/${selectedRoom}`, { withCredentials: true });
        setChat(res.data.data || []);
      } catch (err) {
        console.error("Lỗi lấy lịch sử chat:", err);
      }
    };

    const fetchUser = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/v1/chat/user/${selectedRoom}`, { withCredentials: true });
        setUserInfo(res.data.data || null);
      } catch (err) {
        console.error("Lỗi lấy thông tin user:", err);
      }
    };

    fetchMessages();
    fetchUser();

    if (socket) {
      socket.emit("joinRoom", selectedRoom);
    }
  }, [selectedRoom, socket]);

  const handleReceiveMessage = useCallback(
    (msg) => {
      if (msg.chatRoomId === selectedRoom) {
        setChat((prev) => [...prev, msg]);
      } else {
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.chatRoomId]: (prev[msg.chatRoomId] || 0) + 1,
        }));
      }
    },
    [selectedRoom]
  );

  useEffect(() => {
    if (!socket) return;

    socket.on("receiveMessage", handleReceiveMessage);
    return () => socket.off("receiveMessage", handleReceiveMessage);
  }, [socket, handleReceiveMessage]);

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      const res = await axios.post("http://localhost:4000/api/v1/chat/send", {
        chatRoomId: selectedRoom,
text: message
      }, { withCredentials: true });

      const savedMsg = res.data.data;
      setChat((prev) => [...prev, savedMsg]);
      socket.emit("sendMessage", savedMsg);
      setMessage("");
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err.response?.data || err.message);
    }
  };

  const handleSelectRoom = (room) => {
    setSelectedRoom(room._id);
    setUnreadCounts((prev) => {
      const updated = { ...prev };
      delete updated[room._id];
      return updated;
    });
  };

  return (
    <div className="admin-chat-wrapper">
      <div className="user-list">
        <h4>Danh sách người dùng</h4>
        <ul>
          {chatRooms.map((room) => (
            <li
              key={room._id}
              onClick={() => handleSelectRoom(room)}
              className={selectedRoom === room._id ? "active" : ""}
            >
              {room.user?.username || "Không rõ tên"}
              {unreadCounts[room._id] && (
                <span className="unread-badge">{unreadCounts[room._id]}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="chat-box-area">
        <h4>Lịch sử trò chuyện</h4>
        {selectedRoom ? (
          <>
            <p>
              <strong>Đang trò chuyện với:</strong>{" "}
              {userInfo?.username || userInfo?.email || "Không rõ"}
            </p>
            <div className="chat-history">
              {chat.map((msg, idx) => {
                const isMe = String(msg.senderId) === String(user._id);
                const isAdmin = msg.senderRole === "admin";

                return (
                  <div key={idx} className={`message-row ${isMe ? "admin" : isAdmin ? "admin-other" : "user"}`}>
                    <div className="sender-name" style={{ fontWeight: "bold", fontSize: "0.85rem", marginBottom: "3px" }}>
                      {isMe ? "Bạn" : isAdmin ? "Admin" : msg.senderName || "Khách"}
                    </div>
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
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button onClick={handleSend}>Gửi</button>
            </div>
          </>
        ) : (
          <p>Vui lòng chọn một phòng chat.</p>
        )}
      </div>
    </div>
  );
};

export default AdminChatPanel;