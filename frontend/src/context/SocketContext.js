// src/context/SocketContext.js

import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext"; // ✅ Lấy user từ context

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useContext(AuthContext); // ✅ Đảm bảo có user để lấy userId

  useEffect(() => {
    if (!user || !user._id) {
      console.warn("⛔ Không có userId hợp lệ. Không kết nối Socket.");
      return;
    }

    const userId = user._id;
    console.log("📡 [SocketContext] Kết nối với userId:", userId);

    const newSocket = io("http://localhost:4000", {
      query: { userId },
      withCredentials: true,
      transports: ["polling", "websocket"]
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Socket connect error:", err);
    });

    return () => {
      console.log("🔌 Ngắt kết nối socket:", newSocket.id);
      newSocket.disconnect();
    };
  }, [user]); // ✅ theo dõi toàn bộ đối tượng user


  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
