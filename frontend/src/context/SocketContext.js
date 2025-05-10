import { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socket = useRef();

  useEffect(() => {
    socket.current = io("http://localhost:4000", {
      withCredentials: true,
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
