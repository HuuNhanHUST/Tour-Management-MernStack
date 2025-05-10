import "./App.css";
import { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";

import Layout from "./components/layout/layout";
import PaymentHistory from "./pages/PaymentHistory";

// 📦 Admin pages
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import TourList from "./pages/admin/Tour/List";
import AddTour from "./pages/admin/Tour/Add";
import EditTour from "./pages/admin/Tour/Edit";
import UserList from "./pages/admin/User/List";

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      {/* 👤 Người dùng - dùng Layout chung */}
      <Route path="/*" element={<Layout />} />
      <Route path="/payment-history" element={<PaymentHistory />} />

      {/* 🛡️ Admin - chỉ khi có role === 'admin' */}
      {user?.role === 'admin' ? (
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tours" element={<TourList />} />
          <Route path="tours/add" element={<AddTour />} />
          <Route path="tours/edit/:id" element={<EditTour />} />
          <Route path="users" element={<UserList />} />
        </Route>
      ) : (
        // 🚫 Nếu không phải admin mà cố vào /admin thì redirect về home
        <Route path="/admin/*" element={<Navigate to="/" replace />} />
      )}
    </Routes>
  );
}

export default App;
