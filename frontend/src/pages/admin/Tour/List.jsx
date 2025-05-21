import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const TourList = () => {
  const [tours, setTours] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:4000/api/v1/tour/all", {
        withCredentials: true,
      })
      .then((res) => {
        setTours(res.data.data);
      })
      .catch((err) => {
        console.error("❌ Lỗi khi tải danh sách tour:", err);
        alert("Không thể tải danh sách tour!");
      });
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tour này?")) {
      try {
        await axios.delete(`http://localhost:4000/api/v1/tour/${id}`, {
          withCredentials: true,
        });
        setTours((prev) => prev.filter((tour) => tour._id !== id));
      } catch (err) {
        console.error("❌ Lỗi khi xóa tour:", err);
        alert("Xóa tour thất bại!");
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN");
  };

  const isExpired = (endDate) => {
    return new Date() > new Date(endDate);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>📋 Danh sách Tour</h3>
        <Link to="/admin/tours/add" className="btn btn-primary">
          + Thêm Tour
        </Link>
      </div>

      <table className="table table-bordered table-hover">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Tên Tour</th>
            <th>Thành phố</th>
            <th>Ngày đi</th>
            <th>Ngày về</th>
            <th>Giá</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {tours.map((tour, index) => {
            const expired = isExpired(tour.endDate);

            return (
              <tr key={tour._id} className={expired ? "table-danger" : ""}>
                <td>{index + 1}</td>
                <td>
                  {expired ? (
                    <span style={{ textDecoration: "line-through" }}>
                      {tour.title}
                    </span>
                  ) : (
                    tour.title
                  )}
                </td>
                <td>{tour.city}</td>
                <td>{formatDate(tour.startDate)}</td>
                <td>{formatDate(tour.endDate)}</td>
                <td>{tour.price.toLocaleString("vi-VN")}đ</td>
                <td>
                  {expired ? (
                    <span className="text-danger fw-bold">Đã kết thúc</span>
                  ) : (
                    <span className="text-success">Còn hiệu lực</span>
                  )}
                </td>
                <td>
                  <Link
                    to={`/admin/tours/edit/${tour._id}`}
                    className="btn btn-warning btn-sm me-2"
                  >
                    Sửa
                  </Link>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(tour._id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TourList;
