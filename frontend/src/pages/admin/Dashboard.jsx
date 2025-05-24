import React, { useEffect, useState, useContext, useCallback } from "react";
import axios from "axios";
import { BASE_URL } from "../../utils/config";
import { AuthContext } from "../../context/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { useNavigate } from "react-router-dom";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    tours: 0,
    orders: 0,
    revenue: 0,
  });
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 7))
  );
  const [endDate, setEndDate] = useState(new Date());
  const [orderData, setOrderData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch general dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/dashboard/stats`, {
          withCredentials: true,
        });
        setStats(res.data.data || {});
      } catch (err) {
        console.error("❌ Lỗi khi tải dữ liệu dashboard:", err);
        if (err.response?.status === 401) {
          navigate("/login");
        }
      }
    };

    if (user && user.role === "admin") {
      fetchDashboardStats();
    } else if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Function to fill missing dates with zero values
  const fillMissingDates = useCallback((start, end, data, key = 'count') => {
    const dateArray = [];
    let currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const existing = data.find((item) => item.date === dateStr);
      dateArray.push({
        date: dateStr,
        [key]: existing ? existing[key] : 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
  }, []);

  // Fetch order and revenue data
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching stats with params:", {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      });
      const [orderRes, revenueRes] = await Promise.all([
        axios.get(`${BASE_URL}/dashboard/orders`, {
          params: {
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
          },
          withCredentials: true,
        }),
        axios.get(`${BASE_URL}/dashboard/revenue`, {
          params: {
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
          },
          withCredentials: true,
        }),
      ]);
      console.log("API Response (Orders):", orderRes.data);
      console.log("API Response (Revenue):", revenueRes.data);
      const orderData = orderRes.data.data || [];
      const revenueData = revenueRes.data.data || [];
      if (Array.isArray(orderData) && Array.isArray(revenueData)) {
        // Fill in missing dates
        const filledOrderData = fillMissingDates(startDate, endDate, orderData, 'count');
        const filledRevenueData = fillMissingDates(startDate, endDate, revenueData, 'total');
        setOrderData(filledOrderData);
        setRevenueData(filledRevenueData);
      } else {
        console.error("Dữ liệu không đúng định dạng:", { orderData, revenueData });
        setError("Dữ liệu từ server không đúng định dạng.");
        setOrderData([]);
        setRevenueData([]);
      }
    } catch (err) {
      console.error("❌ Lỗi khi tải dữ liệu:", {
        message: err.message,
        response: err.response ? err.response.data : null,
        status: err.response ? err.response.status : null,
      });
      setError(
        `Không thể tải dữ liệu: ${
          err.response?.status === 401
            ? "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."
            : err.response?.status === 403
            ? "Bạn không có quyền truy cập."
            : err.response?.status === 404
            ? "Endpoint không tồn tại."
            : err.response?.status >= 500
            ? "Lỗi server. Vui lòng thử lại sau."
            : "Lỗi không xác định. Vui lòng kiểm tra kết nối."
        }`
      );
      if (err.response?.status === 401) {
        navigate("/login");
      }
      setOrderData([]);
      setRevenueData([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, navigate, fillMissingDates, setOrderData, setRevenueData, setLoading, setError]);

  // Fetch initial data on component mount
  useEffect(() => {
    if (user && user.role === "admin") {
      fetchStats();
    } else if (!user) {
      navigate("/login");
    }
  }, [user, navigate, fetchStats]); // Updated dependency array

  // Prepare order chart data
  const orderChartData = {
    labels: orderData.map((item) => item.date || ""),
    datasets: [
      {
        label: "Số đơn hàng",
        data: orderData.map((item) => item.count || 0),
        borderColor: "#0d6efd",
        backgroundColor: "rgba(13, 110, 253, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Prepare revenue chart data
  const revenueChartData = {
    labels: revenueData.map((item) => item.date || ""),
    datasets: [
      {
        label: "Doanh thu (₫)",
        data: revenueData.map((item) => item.total || 0),
        borderColor: "#dc3545",
        backgroundColor: "rgba(220, 53, 69, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Thống kê đơn hàng theo ngày",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Ngày",
        },
      },
      y: {
        title: {
          display: true,
          text: "Số đơn hàng",
        },
        min: 0,
      },
    },
  };

  const revenueChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Thống kê doanh thu theo ngày",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Ngày",
        },
      },
      y: {
        title: {
          display: true,
          text: "Doanh thu (₫)",
        },
        min: 0,
        ticks: {
          callback: function (value) {
            return value.toLocaleString() + "₫";
          },
        },
      },
    },
  };

  // Calculate totals
  const totalChartOrders = orderData.reduce((sum, item) => sum + (item.count || 0), 0);
  const totalChartRevenue = revenueData.reduce((sum, item) => sum + (item.total || 0), 0);

  // If user is not an admin, show a message
  if (user && user.role !== "admin") {
    return (
      <div className="container py-4 text-center">
        <h3 className="text-danger">Bạn không có quyền truy cập trang này.</h3>
        <p>Vui lòng đăng nhập với tài khoản admin.</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h3 className="text-primary fw-bold text-center mb-4">
        Tổng quan hệ thống
      </h3>

      <div className="row g-4">
        {[
          {
            label: "Người dùng",
            icon: "ri-user-3-line",
            color: "text-primary",
            value: stats.users,
          },
          {
            label: "Tours",
            icon: "ri-map-pin-line",
            color: "text-success",
            value: stats.tours,
          },
          {
            label: "Đơn hàng",
            icon: "ri-shopping-cart-line",
            color: "text-warning",
            value: stats.orders,
          },
          {
            label: "Doanh thu",
            icon: "ri-money-dollar-circle-line",
            color: "text-danger",
            value: stats.revenue.toLocaleString() + "₫",
          },
        ].map((item, index) => (
          <div className="col-md-3" key={index}>
            <div
              className={`rounded-4 border text-center p-3 bg-warning bg-opacity-50 transition-all hover:shadow-lg hover:-translate-y-1 h-100`}
            >
              <i className={`${item.icon} fs-2 mb-2 ${item.color}`}></i>
              <h6 className="fw-semibold mb-1">{item.label}</h6>
              <h4 className="fw-bold">{item.value}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <h4 className="text-center mb-4">Thống kê đơn hàng & doanh thu</h4>
        <div className="d-flex justify-content-center gap-3 mb-4 align-items-end">
          <div>
            <label className="form-label">Từ ngày:</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              className="form-control"
              dateFormat="dd/MM/yyyy"
            />
          </div>
          <div>
            <label className="form-label">Đến ngày:</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              className="form-control"
              dateFormat="dd/MM/yyyy"
            />
          </div>
          <div>
            <button
              className="btn btn-primary"
              onClick={fetchStats}
              disabled={loading}
              style={{ marginBottom: "0.5rem" }}
            >
              {loading ? "Đang tải..." : "Lọc"}
            </button>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <h5 className="text-center mb-3">Thống kê đơn hàng</h5>
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              {loading ? (
                <p className="text-center">Đang tải dữ liệu...</p>
              ) : error ? (
                <p className="text-center text-danger">{error}</p>
              ) : orderData.length > 0 ? (
                <>
                  <Line data={orderChartData} options={chartOptions} />
                  <p className="text-center mt-3">
                    Tổng số đơn hàng trong khoảng thời gian: <strong>{totalChartOrders}</strong>
                    {totalChartOrders !== stats.orders && (
                      <span className="text-muted">
                        {" "}
                        (Tổng đơn hàng hệ thống: {stats.orders})
                      </span>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-center">
                  Không có dữ liệu đơn hàng. Vui lòng chọn khoảng thời gian và nhấn "Lọc".
                </p>
              )}
            </div>
          </div>

          <div className="col-md-6">
            <h5 className="text-center mb-3">Thống kê doanh thu</h5>
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              {loading ? (
                <p className="text-center">Đang tải dữ liệu...</p>
              ) : error ? (
                <p className="text-center text-danger">{error}</p>
              ) : revenueData.length > 0 ? (
                <>
                  <Line data={revenueChartData} options={revenueChartOptions} />
                  <p className="text-center mt-3">
                    Tổng doanh thu trong khoảng thời gian: <strong>{totalChartRevenue.toLocaleString()}₫</strong>
                    {totalChartRevenue !== stats.revenue && (
                      <span className="text-muted">
                        {" "}
                        (Tổng doanh thu hệ thống: {stats.revenue.toLocaleString()}₫)
                      </span>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-center">
                  Không có dữ liệu doanh thu. Vui lòng chọn khoảng thời gian và nhấn "Lọc".
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;