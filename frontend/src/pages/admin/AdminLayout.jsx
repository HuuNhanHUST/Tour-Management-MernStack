import React, { useContext, useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";

const AdminLayout = () => {
    console.log("AdminLayout render")
  const { user, loading, dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    if (!loading) {
      setCheckedAuth(true);
    }
  }, [loading]);

  useEffect(() => {
    if (!checkedAuth) return;
    if (!user || user.role !== "admin") {
      navigate("/");
    }
  }, [checkedAuth, user, navigate]);
  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <div className="bg-dark text-white p-3" style={{ width: "250px" }}>
        <h4>Admin Panel</h4>

        {user && (
          <div className="mt-3 small">
            <i className="ri-user-line me-2"></i> {user.username || user.email}
          </div>
        )}

        <ul className="nav flex-column mt-4">
          <li className="nav-item">
            <Link className="nav-link text-white" to="/admin/dashboard">📊 Dashboard</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white" to="/admin/tours">🧭 Tour Manager</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white" to="/admin/users">👤 User Manager</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white" to="/admin/chat">💬 Chat</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white" to="/admin/payments">💳 Payment Manager</Link>
          </li>
          <li className="nav-item mt-3">
            <button onClick={async () => {
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
            }} className="btn btn-outline-light btn-sm w-100">
              🚪 Logout
            </button>
          </li>
        </ul>
      </div>

      <div className="flex-grow-1 p-4">
        <Outlet />
      </div>
    </div>
  );
};

export default React.memo(AdminLayout); // ✅ Bọc memo
