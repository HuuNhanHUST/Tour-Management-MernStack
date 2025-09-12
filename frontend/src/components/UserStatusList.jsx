import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment"; // nhớ cài moment: npm install moment

const UserStatusList = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/user-status", {
          withCredentials: true
        });
        setUsers(res.data || []);
      } catch (err) {
        console.error("❌ Failed to load user status:", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // cập nhật mỗi 10 giây
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h5>Trạng thái người dùng</h5>
      <ul className="list-group">
        {Array.isArray(users) && users.map((item) => (
          <li
            key={item.userId?._id || item._id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <span>{item.userId?.username || "Ẩn danh"}</span>
            <span>
              {item.isOnline ? (
                <span className="badge bg-success">Online</span>
              ) : (
                <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                  {moment(item.lastSeen).fromNow()}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserStatusList;
