import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const PaymentHistory = () => {
  const { user } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/payment/user/${user._id}`, {
            withCredentials: true
          });
        setPayments(res.data);
      } catch (err) {
        console.error("❌ Không thể lấy dữ liệu:", err.message);
      }
    };

    if (user?._id) fetchPayments();
  }, [user]);

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-primary fw-bold text-center">
        💳 Lịch sử thanh toán của bạn
      </h2>

      {payments.length === 0 ? (
        <p className="text-center text-muted">Bạn chưa có giao dịch nào.</p>
      ) : (
        <div className="table-responsive shadow rounded">
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-dark text-center">
              <tr>
                <th>#</th>
                <th>Mã đơn hàng</th>
                <th>Số tiền</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
                <th>Ngày thanh toán</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {payments.map((item, index) => (
                <tr key={item._id}>
                  <td>{index + 1}</td>
                  <td className="text-break">{item.orderId}</td>
                  <td>{item.amount.toLocaleString()}₫</td>
                  <td>{item.payType}</td>
                  <td>
                    <span className={
                      "badge px-3 py-2 " +
                      (item.status === "Success"
                        ? "bg-success"
                        : item.status === "Failed"
                        ? "bg-danger"
                        : "bg-warning text-dark")
                    }>
                      {item.status}
                    </span>
                  </td>
                  <td>{new Date(item.createdAt).toLocaleString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
