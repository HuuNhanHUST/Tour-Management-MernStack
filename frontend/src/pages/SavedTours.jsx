import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext"; // Context chứa thông tin người dùng đăng nhập
import TourCard from "../shared/TourCard"; // Component hiển thị thông tin từng tour

// Component hiển thị danh sách các tour mà người dùng đã lưu yêu thích
const SavedTours = () => {
  // Lấy thông tin người dùng hiện tại từ AuthContext
  const { user } = useContext(AuthContext);

  // State lưu danh sách tour yêu thích
  const [favorites, setFavorites] = useState([]);

  // useEffect được gọi khi component mount hoặc khi giá trị 'user' thay đổi
  useEffect(() => {
    // Hàm bất đồng bộ để lấy danh sách tour yêu thích từ API
    const fetchFavorites = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/v1/users/${user._id}/favorites`);
        const data = await res.json();

        // Cập nhật state favorites nếu API trả về hợp lệ
        setFavorites(data.favorites || []);
      } catch (error) {
        console.error("Lỗi khi tải danh sách tour yêu thích:", error);
      }
    };

    // Chỉ gọi API nếu người dùng đã đăng nhập
    if (user) fetchFavorites();
  }, [user]); // Khi user thay đổi (ví dụ đăng nhập/đăng xuất), effect sẽ chạy lại

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Tour yêu thích của bạn</h2>

      <div className="row">
        {/* Nếu có tour yêu thích, hiển thị danh sách */}
        {favorites.length > 0 ? (
          favorites.map((tour) => (
            <div className="col-lg-3 col-md-4 col-sm-6 mb-4" key={tour._id}>
              {/* Mỗi tour hiển thị bằng component TourCard */}
              <TourCard tour={tour} />
            </div>
          ))
        ) : (
          // Nếu chưa có tour nào yêu thích, hiển thị thông báo
          <p>Bạn chưa lưu tour nào vào danh sách yêu thích.</p>
        )}
      </div>
    </div>
  );
};

export default SavedTours;
