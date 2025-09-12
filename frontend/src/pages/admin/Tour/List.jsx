import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const TourList = () => {
  const [tours, setTours] = useState([]);

  useEffect(() => {
    // Add loading state management
    const fetchTours = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/v1/tour/all", {
          withCredentials: true,
        });
        
        if (response.data && Array.isArray(response.data.data)) {
          // Sort tours by start date (most recent first)
          const sortedTours = response.data.data.sort((a, b) => 
            new Date(b.startDate) - new Date(a.startDate)
          );
          setTours(sortedTours);
          console.log("Loaded tours:", sortedTours);
        } else {
          console.error("Invalid tour data format:", response.data);
          alert("Định dạng dữ liệu tour không hợp lệ!");
        }
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách tour:", err);
        alert("Không thể tải danh sách tour!");
      }
    };
    
    fetchTours();
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
    return date.toLocaleDateString("en-US", { day: "numeric", month: "numeric", year: "numeric" });
  };

  const isExpired = (endDate) => {
    return new Date() > new Date(endDate);
  };

  const getImageUrl = (photo) => {
    if (!photo) return "https://via.placeholder.com/80";
    return photo.startsWith("http") ? photo : `http://localhost:4000/uploads/${photo}`;
  };

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
            margin-bottom: 1rem;
          }

          .table-custom thead {
            background: linear-gradient(145deg, #90EE90, #98FB98);
            color: #fff;
            font-weight: 600;
            text-transform: uppercase;
            box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3),
                       -3px -3px 6px rgba(255, 255, 255, 0.3);
          }

          .table-custom th, .table-custom td {
            padding: 1rem;
            vertical-align: middle;
            border: 1px solid rgba(0, 0, 0, 0.1);
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

          .table-container {
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }

          .table-custom {
            border-collapse: collapse;
          }

          .expired-tour {
            text-decoration: line-through;
          }

          .add-tour-btn {
            display: inline-block;
            padding: 0.8rem 2rem;
            background: linear-gradient(145deg, #FFFACD, #FFFFE0);
            color: #333;
            font-weight: 600;
            border-radius: 25px;
            border: none;
            box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.2),
                       -3px -3px 6px rgba(255, 255, 255, 0.5);
            transition: all 0.3s ease;
            text-decoration: none;
            margin-bottom: 1.5rem;
          }

          .add-tour-btn:hover {
            transform: translateY(-3px) scale(1.05);
            box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.3),
                       -5px -5px 10px rgba(255, 255, 255, 0.6);
            background: linear-gradient(145deg, #FFFFE0, #FFFACD);
            color: #222;
          }
        `}
      </style>

      <h3 className="title-3d">
        Danh sách Tour
      </h3>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <small className="text-muted">
            {tours.length} tours được tìm thấy
          </small>
        </div>
        <Link to="/admin/tours/add" className="add-tour-btn">
          + Thêm Tour
        </Link>
      </div>

      <div className="table-container">
        <div className="table-responsive">
          <table className="table table-custom">
            <thead>
              <tr>
                <th>#</th>
                <th>Ảnh</th>
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
              {tours.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-muted text-center py-4">
                    Không có tour nào.
                  </td>
                </tr>
              ) : (
                tours.map((tour, index) => {
                  const expired = isExpired(tour.endDate);
                  return (
                    <tr key={tour._id} className={expired ? "table-danger" : ""}>
                      <td>{index + 1}</td>
                      <td>
                        <img
                          src={getImageUrl(tour.photo)}
                          alt={tour.title}
                          style={{ width: "80px", height: "50px", objectFit: "cover", borderRadius: "5px" }}
                        />
                      </td>
                      <td className={expired ? "expired-tour" : ""}>
                        {tour.title}
                      </td>
                      <td>{tour.city}</td>
                      <td>{formatDate(tour.startDate)}</td>
                      <td>{formatDate(tour.endDate)}</td>
                      <td>${tour.price.toLocaleString()}</td>
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TourList;