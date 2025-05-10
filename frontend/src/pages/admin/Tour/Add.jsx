import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AddTour = () => {
  const navigate = useNavigate();
  const [tour, setTour] = useState({
    title: "",
    city: "",
    address: "",
    distance: "",
    desc: "",
    price: "",
    maxGroupSize: "",
    featured: false,
  });

  const [imageFile, setImageFile] = useState(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    let newValue = value;

    // ✅ Xử lý loại bỏ 0 đầu nếu nhập số
    if (type === "text" && ["distance", "price", "maxGroupSize"].includes(name)) {
      newValue = value.replace(/^0+/, "");
      // Không cho để rỗng
      if (newValue === "") newValue = "0";
    }

    setTour({
      ...tour,
      [name]: newValue,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();

      for (const key in tour) {
        formData.append(key, tour[key]);
      }

      formData.append("photo", imageFile);

      await axios.post("http://localhost:4000/api/v1/tour", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true, // ✅ Gửi cookie
      });

      alert("✅ Thêm tour thành công!");
      navigate("/admin/tours");
    } catch (err) {
      console.error("Lỗi upload:", err);
      alert("❌ Upload thất bại. Kiểm tra dữ liệu hoặc file!");
    }
  };

  return (
    <div>
      <h3>➕ Thêm Tour mới</h3>
      <form onSubmit={handleSubmit} className="mt-4 row g-3">
        <div className="col-md-6">
          <label className="form-label">Tên tour</label>
          <input
            type="text"
            className="form-control"
            name="title"
            value={tour.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Thành phố</label>
          <input
            type="text"
            className="form-control"
            name="city"
            value={tour.city}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Địa chỉ</label>
          <input
            type="text"
            className="form-control"
            name="address"
            value={tour.address}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Khoảng cách (km)</label>
          <input
            type="text"
            className="form-control"
            name="distance"
            value={tour.distance}
            onChange={handleChange}
            required
            inputMode="numeric"
            pattern="[0-9]*"
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Số người tối đa</label>
          <input
            type="text"
            className="form-control"
            name="maxGroupSize"
            value={tour.maxGroupSize}
            onChange={handleChange}
            required
            inputMode="numeric"
            pattern="[0-9]*"
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Giá tour</label>
          <input
            type="text"
            className="form-control"
            name="price"
            value={tour.price}
            onChange={handleChange}
            required
            inputMode="numeric"
            pattern="[0-9]*"
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Nổi bật?</label>
          <select
            className="form-select"
            name="featured"
            value={tour.featured}
            onChange={(e) =>
              setTour({ ...tour, featured: e.target.value === "true" })
            }
          >
            <option value="false">Không</option>
            <option value="true">Có</option>
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label">Ảnh (chọn từ máy)</label>
          <input
            type="file"
            accept="image/*"
            className="form-control"
            onChange={(e) => setImageFile(e.target.files[0])}
            required
          />
        </div>

        <div className="col-12">
          <label className="form-label">Mô tả</label>
          <textarea
            className="form-control"
            name="desc"
            rows="3"
            value={tour.desc}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <div className="col-12">
          <button className="btn btn-success">Thêm Tour</button>
        </div>
      </form>
    </div>
  );
};

export default AddTour;
