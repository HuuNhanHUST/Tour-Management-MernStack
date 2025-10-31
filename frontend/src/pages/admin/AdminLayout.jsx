import React, { useContext, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../../assets/images/logo.png";
import UserStatusList from "../../components/UserStatusList"; // hoặc đúng path của bạn

import {
  RiDashboardLine,
  RiUserLine,
  RiMapPinLine,
  RiChat3Line,
  RiBankCardLine,
  RiFileListLine,
} from "react-icons/ri";

const AdminLayout = () => {
  const { user, loading, dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "admin") {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:4000/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      dispatch({ type: "LOGOUT" });
      localStorage.removeItem("user");
      navigate("/login");
    } catch (err) {
      console.error("❌ Lỗi logout:", err);
      alert("Lỗi khi đăng xuất");
    }
  };

  // Debug user info (bạn có thể bỏ khi đã ổn)
  // console.log("Current user:", user);

  // Lấy tên hiển thị: ưu tiên username, fallback email, fallback 'Anonymous'
  const displayName =
    (user && typeof user.username === "string" && user.username.trim() !== "")
      ? user.username
      : (user && typeof user.email === "string" && user.email.trim() !== "")
      ? user.email
      : "Anonymous";

  return (
    <div
      className="d-flex"
      style={{
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
        backgroundColor: "#fff",
      }}
    >
      {/* Sidebar */}
      <div
        className="p-4 d-flex flex-column"
        style={{
          width: "250px",
          background: "linear-gradient(to bottom, #FFD700, #FFA500)",
          boxShadow: "3px 0 10px rgba(0, 0, 0, 0.2)",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div className="text-center mb-4">
          <img
            src={logo}
            alt="Admin Logo"
            style={{ width: "140px", objectFit: "contain" }}
          />
        </div>
        <h4 className="text-center mb-4 fw-bold text-black">Admin Panel</h4>

        <ul className="nav flex-column gap-2">
          <li className="nav-item">
            <Link
              className="nav-link text-black px-3 py-2 rounded d-flex align-items-center gap-2"
              to="/admin/dashboard"
            >
              <RiDashboardLine color="#000" size={20} /> Dashboard
            </Link>
          </li>
          <li className="nav-item">
            <Link
              className="nav-link text-black px-3 py-2 rounded d-flex align-items-center gap-2"
              to="/admin/tours"
            >
              <RiMapPinLine color="#000" size={20} /> Tour Manager
            </Link>
          </li>
          <li className="nav-item">
            <Link
              className="nav-link text-black px-3 py-2 rounded d-flex align-items-center gap-2"
              to="/admin/pricing"
            >
              <RiBankCardLine color="#000" size={20} /> Quản lý giá
            </Link>
          </li>
          <li className="nav-item">
            <Link
              className="nav-link text-black px-3 py-2 rounded d-flex align-items-center gap-2"
              to="/admin/tour-guides"
            >
              <RiMapPinLine color="#000" size={20} /> TourGuide Manager
            </Link>
          </li>
          <li className="nav-item">
            <Link
              className="nav-link text-black px-3 py-2 rounded d-flex align-items-center gap-2"
              to="/admin/users"
            >
              <RiUserLine color="#000" size={20} /> User Manager
            </Link>
          </li>
          <li className="nav-item">
            <Link
              className="nav-link text-black px-3 py-2 rounded d-flex align-items-center gap-2"
              to="/admin/chat"
            >
              <RiChat3Line color="#000" size={20} /> Chat
            </Link>
          </li>
          <li className="nav-item">
            <Link
              className="nav-link text-black px-3 py-2 rounded d-flex align-items-center gap-2"
              to="/admin/payments"
            >
              <RiBankCardLine color="#000" size={20} /> Payment Manager
            </Link>
          </li>
          <li className="nav-item">
            <Link
              className="nav-link text-black px-3 py-2 rounded d-flex align-items-center gap-2"
              to="/admin/bookings"
            >
              <RiFileListLine color="#000" size={20} /> Quản lý Booking
            </Link>
          </li>
        </ul>
        <hr className="my-2" />

  {/* 👇 Danh sách người dùng đang online */}
  <div>
    <h6 className="fw-bold text-dark">Online Users</h6>
    <div style={{ maxHeight: "200px", overflowY: "auto" }}>
      <UserStatusList />
    </div>
  </div>
      </div>

      {/* Right content */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* Top bar */}
        <div
          className="d-flex justify-content-between align-items-center px-4 py-2 bg-white shadow-sm"
          style={{
            position: "sticky",
            top: 10,
            zIndex: 1000,
            borderRadius: "12px",
            margin: "10px 20px 0 20px",
            boxShadow:
              "0 4px 8px rgba(255, 215, 0, 0.3), 0 6px 20px rgba(255, 165, 0, 0.25)",
          }}
        >
          <div className="fw-semibold text-dark d-flex align-items-center">
            <RiUserLine className="me-2" />
            {displayName}
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-warning btn-sm fw-semibold"
            style={{
              boxShadow: "0 4px 6px rgba(255, 193, 7, 0.6)",
              borderRadius: "10px",
              padding: "6px 20px",
              fontWeight: "600",
              color: "#5a4300",
              border: "1px solid #b38600",
              background: "linear-gradient(145deg, #fff176, #fbc02d)",
            }}
          >
            🚪 Logout
          </button>
        </div>

        {/* Main content */}
        <div
          className="flex-grow-1 p-4 bg-light"
          style={{
            marginTop: "10px",
            borderRadius: "12px",
            backgroundColor: "#fefdf5",
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default React.memo(AdminLayout);