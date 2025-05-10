import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

import Header from "../header/header";
import Routers from "../../router/Routers";
import Footer from "../footer/footer";
import ChatPopup from "../chat/ChatPopup";

const Layout = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin"); // 🚫 chặn admin vào home
    }
  }, [user, navigate]);

  return (
    <>
      <Header />
      <Routers />
      <Footer />
      <ChatPopup />
    </>
  );
};

export default Layout;
