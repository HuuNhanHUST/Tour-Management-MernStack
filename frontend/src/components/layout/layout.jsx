import React, { useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

import Header from "../header/header";
import Routers from "../../router/Routers";
import Footer from "../footer/footer";
import ChatPopup from "../chat/ChatPopup";

const Layout = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const redirectedRef = useRef(false); // Flag để kiểm soát redirect

  useEffect(() => {
    if (!redirectedRef.current && user?.role === "admin") {
      redirectedRef.current = true; // Đánh dấu đã redirect
      navigate("/admin"); // Redirect chỉ chạy 1 lần
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
