import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { BASE_URL } from "../../utils/config";
import { AuthContext } from "../../context/AuthContext";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    users: 0,
    tours: 0,
    orders: 0,
    revenue: 0,
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/dashboard/stats`, {
          withCredentials: true,
        });
        setStats(res.data.data || {});
      } catch (err) {
        console.error("❌ Lỗi khi tải dữ liệu dashboard:", err);
      }
    };

    if (user?.role === "admin") {
      fetchDashboardStats();
    }
  }, [user]);

  return (
    <div>
      <h2 className="mb-4">📊 Tổng quan hệ thống</h2>
      <div className="row g-4">
        <div className="col-md-3">
          <div className="card text-white bg-primary shadow">
            <div className="card-body">
              <h5 className="card-title">👤 Người dùng</h5>
              <h3>{stats.users}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-success shadow">
            <div className="card-body">
              <h5 className="card-title">🧭 Tours</h5>
              <h3>{stats.tours}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-warning shadow">
            <div className="card-body">
              <h5 className="card-title">📦 Đơn hàng</h5>
              <h3>{stats.orders}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-danger shadow">
            <div className="card-body">
              <h5 className="card-title">💰 Doanh thu</h5>
              <h3>{stats.revenue.toLocaleString()}đ</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
