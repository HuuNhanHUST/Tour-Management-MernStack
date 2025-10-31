import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const TourGuideList = () => {
  const [tourGuides, setTourGuides] = useState([]);

  useEffect(() => {
    const fetchTourGuides = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/v1/tour-guides", {
          withCredentials: true,
        });
        
        if (response.data && Array.isArray(response.data.data)) {
          setTourGuides(response.data.data);
        } else {
          console.error("Invalid tour guide data format:", response.data);
          alert("Định dạng dữ liệu hướng dẫn viên không hợp lệ!");
        }
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách hướng dẫn viên:", err);
        alert("Không thể tải danh sách hướng dẫn viên!");
      }
    };
    
    fetchTourGuides();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa hướng dẫn viên này?")) {
      try {
        await axios.delete(`http://localhost:4000/api/v1/tour-guides/${id}`, {
          withCredentials: true,
        });
        setTourGuides((prev) => prev.filter((guide) => guide._id !== id));
      } catch (err) {
        console.error("❌ Lỗi khi xóa hướng dẫn viên:", err);
        alert("Xóa hướng dẫn viên thất bại!");
      }
    }
  };

  const getImageUrl = (photo) => {
    if (!photo) return "https://via.placeholder.com/80";
    return photo.startsWith("http") ? photo : `http://localhost:4000/${photo}`;
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

          .add-btn {
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

          .add-btn:hover {
            transform: translateY(-3px) scale(1.05);
            box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.3),
                       -5px -5px 10px rgba(255, 255, 255, 0.6);
            background: linear-gradient(145deg, #FFFFE0, #FFFACD);
            color: #222;
          }
        `}
      </style>

      <h3 className="title-3d">
        Danh sách Hướng dẫn viên
      </h3>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <small className="text-muted">
            {tourGuides.length} hướng dẫn viên được tìm thấy
          </small>
        </div>
        <Link to="/admin/tour-guides/add" className="add-btn">
          + Thêm Hướng dẫn viên
        </Link>
      </div>

      <div className="table-container">
        <div className="table-responsive">
          <table className="table table-custom">
            <thead>
              <tr>
                <th>#</th>
                <th>Ảnh</th>
                <th>Tên</th>
                <th>Email</th>
                <th>Điện thoại</th>
                <th>Kinh nghiệm (năm)</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {tourGuides.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-muted text-center py-4">
                    Không có hướng dẫn viên nào.
                  </td>
                </tr>
              ) : (
                tourGuides.map((guide, index) => (
                  <tr key={guide._id}>
                    <td>{index + 1}</td>
                    <td>
                      <img
                        src={getImageUrl(guide.photo)}
                        alt={guide.name}
                        style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "50%" }}
                      />
                    </td>
                    <td>{guide.name}</td>
                    <td>{guide.email}</td>
                    <td>{guide.phone || "N/A"}</td>
                    <td>{guide.experience}</td>
                    <td>
                      <Link
                        to={`/admin/tour-guides/edit/${guide._id}`}
                        className="btn btn-warning btn-sm me-2"
                      >
                        Sửa
                      </Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(guide._id)}
                      >
                        Xóa
                      </button>
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

export default TourGuideList;
