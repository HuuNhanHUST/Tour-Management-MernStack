import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socket = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    socket.current = io("http://localhost:4000", {
      withCredentials: true,
    });

    socket.current.on("connect", () => {
      console.log("✅ Socket connected:", socket.current.id);
      setReady(true); // đánh dấu là đã sẵn sàng
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={ready ? socket.current : null}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
