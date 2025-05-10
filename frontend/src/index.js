import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "remixicon/fonts/remixicon.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import { AuthContextProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext"; // 👈 thêm

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <AuthContextProvider>
      <SocketProvider> {/* 👈 bọc App trong SocketProvider */}
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SocketProvider>
    </AuthContextProvider>
  </React.StrictMode>
);
