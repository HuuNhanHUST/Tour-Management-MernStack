import "./App.css";
import { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";

import Layout from "./components/layout/layout";

// 📦 Admin pages
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import TourList from "./pages/admin/Tour/List";
import AddTour from "./pages/admin/Tour/Add";
import EditTour from "./pages/admin/Tour/Edit";
import UserList from "./pages/admin/User/List";
import AdminChatPanel from "./pages/admin/Chat/AdminChatPanel"; 
import PaymentList from "./pages/admin/PaymentList";
import LoginHistory from "./pages/admin/LoginHistory";
import PricingManager from "./pages/admin/Pricing/PricingManager";
import BookingList from "./pages/admin/Booking/List";
import BookingDetails from "./pages/admin/Booking/Details";

function App() {
  const { user,loading } = useContext(AuthContext);

   if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <div>Đang tải dữ liệu người dùng...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* 👤 Người dùng - dùng Layout chung */}
      <Route path="/*" element={<Layout />} />

      {/* 🛡️ Admin - chỉ khi có role === 'admin' */}
      {user?.role === 'admin' ? (
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tours" element={<TourList />} />
          <Route path="tours/add" element={<AddTour />} />
          <Route path="tours/edit/:id" element={<EditTour />} />
          <Route path="users" element={<UserList />} />
          <Route path="chat" element={<AdminChatPanel />} />
          <Route path="payments" element={<PaymentList />} />
          <Route path="pricing" element={<PricingManager />} />
          <Route path="/admin/login-history" element={<LoginHistory />} />
          <Route path="bookings" element={<BookingList />} />
          <Route path="bookings/:id" element={<BookingDetails />} />

        </Route>
      ) : (
        <Route path="/admin/*" element={<Navigate to="/" replace />} />
      )}
    </Routes>
  );
}

export default App;
