import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";

// Import CSS styles
import "bootstrap/dist/css/bootstrap.min.css";
import "remixicon/fonts/remixicon.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Context Providers
import { AuthContextProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext"; // ✅ Socket Context

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <AuthContextProvider>
      <SocketProvider> {/* ✅ Bọc App trong SocketProvider để có socket toàn cục */}
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SocketProvider>
    </AuthContextProvider>
  </React.StrictMode>
);
