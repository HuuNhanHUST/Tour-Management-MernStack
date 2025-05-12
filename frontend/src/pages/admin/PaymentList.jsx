import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../utils/config";

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleChangeStatus = async (id, newStatus) => {
    try {
      await axios.put(`${BASE_URL}/payment/${id}/status`, { status: newStatus }, { withCredentials: true });
      alert("✔️ Đã cập nhật trạng thái");
      setPayments((prev) =>
        prev.map((p) => (p._id === id ? { ...p, status: newStatus } : p))
      );
    } catch (err) {
      alert("❌ Cập nhật thất bại");
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesStatus = filterStatus === "All" || p.status === filterStatus;
    const matchesSearch = p.userId?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="container py-4">
      <h3 className="mb-4 fw-bold d-flex align-items-center gap-2">
        <i className="ri-file-list-line text-primary"></i>
        Quản lý thanh toán
      </h3>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row mb-3">
        <div className="col-md-4">
          <label className="fw-semibold">Lọc theo trạng thái:</label>
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
          <label className="fw-semibold">Tìm theo tên hoặc email:</label>
          <input
            type="text"
            className="form-control"
            placeholder="Nhập tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive shadow rounded">
        <table className="table table-striped table-hover align-middle text-center">
          <thead className="table-dark">
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
                <td colSpan="7" className="text-muted">Không có giao dịch nào.</td>
              </tr>
            ) : (
              filteredPayments.map((p, index) => (
                <tr key={p._id}>
                  <td>{index + 1}</td>
                  <td className="text-break">{p.orderId}</td>
                  <td>{p.amount.toLocaleString()}₫</td>
                  <td>{p.payType}</td>
                  <td>
                    <span className={
                      "badge rounded-pill px-3 py-2 fw-semibold " +
                      (p.status === "Success"
                        ? "bg-success"
                        : p.status === "Failed"
                        ? "bg-danger"
                        : "bg-warning text-dark")
                    }>
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
                      className="form-select form-select-sm"
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
  );
};

export default PaymentList;
