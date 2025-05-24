import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../utils/config";

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch payment list
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/payment/all`, { withCredentials: true });
        setPayments(res.data);
      } catch (err) {
        setError("❌ Không thể tải danh sách thanh toán.");
        console.error(err);
      }
    };
    fetchPayments();
  }, []);

  // Change order status
  const handleChangeStatus = async (id, newStatus) => {
    try {
      await axios.put(
        `${BASE_URL}/payment/${id}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      alert("✔️ Đã cập nhật trạng thái");
      setPayments((prev) =>
        prev.map((p) => (p._id === id ? { ...p, status: newStatus } : p))
      );
    } catch (err) {
      console.error("❌ Lỗi cập nhật trạng thái:", err.response?.data || err.message);
      alert(err.response?.data?.message || "❌ Cập nhật trạng thái thất bại");
    }
  };

  // Filter displayed data
  const filteredPayments = payments.filter((p) => {
    const matchesStatus = filterStatus === "All" || p.status === filterStatus;
    const matchesSearch =
      searchTerm.trim() === "" ||
      (p.userId &&
        ((p.userId.username &&
          p.userId.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
         (p.userId.email &&
          p.userId.email.toLowerCase().includes(searchTerm.toLowerCase()))));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="container py-3">
      <style>
        {`
          .title-3d {
            font-size: 2.5rem;
            font-weight: 700;
            color: #28a745;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 2px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3),
                        -2px -2px 4px rgba(255, 255, 255, 0.3);
            margin-bottom: 2rem;
          }

          .table-custom thead {
            background: linear-gradient(145deg, #28a745, #218838);
            color: #fff;
            font-weight: 600;
            text-transform: uppercase;
            box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3),
                       -3px -3px 6px rgba(255, 255, 255, 0.3);
          }

          .table-custom th, .table-custom td {
            padding: 1rem;
            vertical-align: middle;
            border: 1px solid rgba(0, 0, 0, 0.1); /* Vertical and horizontal borders */
            text-align: center;
          }

          .table-custom tbody tr {
            transition: all 0.3s ease;
            background-color: #fff;
          }

          .table-custom tbody tr:hover {
            background-color: #f1f8ff;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }

          .badge-custom {
            padding: 0.5rem 1rem;
            font-size: 0.9rem;
            border-radius: 20px;
          }

          .select-custom {
            width: 120px;
            margin: 0 auto;
            border-radius: 10px;
            padding: 0.5rem;
            font-size: 0.9rem;
          }

          .filter-section {
            background-color: #f8f9fa;
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
          }

          .table-container {
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }

          .table-custom {
            border-collapse: collapse; /* Ensures borders are merged */
          }
        `}
      </style>

      <h3 className="title-3d">
        Quản lý thanh toán
      </h3>

      {error && <div className="alert alert-danger text-center">{error}</div>}

      <div className="filter-section row mb-4">
        <div className="col-md-4 mb-3 mb-md-0">
          <label className="fw-semibold mb-2">Lọc theo trạng thái:</label>
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">Tất cả</option>
            <option value="Pending">Pending</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
        <div className="col-md-4">
          <label className="fw-semibold mb-2">Tìm theo tên hoặc email:</label>
          <input
            type="text"
            className="form-control"
            placeholder="Nhập tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <div className="table-responsive">
          <table className="table table-custom">
            <thead>
              <tr>
                <th>#</th>
                <th>Mã đơn hàng</th>
                <th>Số tiền</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
                <th>Người thanh toán</th>
                <th>Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-muted text-center py-4">
                    Không có giao dịch nào.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p, index) => (
                  <tr key={p._id}>
                    <td>{index + 1}</td>
                    <td className="text-break">{p.orderId}</td>
                    <td>{p.amount.toLocaleString()}₫</td>
                    <td>{p.payType}</td>
                    <td>
                      <span
                        className={
                          "badge badge-custom " +
                          (p.status === "Success"
                            ? "bg-success"
                            : p.status === "Failed"
                            ? "bg-danger"
                            : "bg-warning text-dark")
                        }
                      >
                        {p.status}
                      </span>
                    </td>
                    <td>
                      {p.userId?.username ? (
                        <>
                          <strong>{p.userId.username}</strong>
                          <br />
                          <small className="text-muted">{p.userId.email}</small>
                        </>
                      ) : (
                        <em className="text-muted">(Ẩn danh)</em>
                      )}
                    </td>
                    <td>
                      <select
                        className="form-select select-custom"
                        value={p.status}
                        onChange={(e) => handleChangeStatus(p._id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Success">Success</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentList;