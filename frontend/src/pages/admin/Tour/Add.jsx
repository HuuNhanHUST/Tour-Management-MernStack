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
    startDate: "",     // ✅ Ngày đi
    endDate: "",       // ✅ Ngày về
  });

  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let newValue = value;

    if (type === "text" && ["distance", "price", "maxGroupSize"].includes(name)) {
      newValue = value.replace(/^0+/, "");
      if (newValue === "") newValue = "0";
    }

    setTour({
      ...tour,
      [name]: newValue,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
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
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
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
        {/* Các trường khác giữ nguyên */}
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

        {/* ✅ Ngày đi */}
        <div className="col-md-6">
          <label className="form-label">Ngày đi</label>
          <input
            type="date"
            className="form-control"
            name="startDate"
            value={tour.startDate}
            onChange={handleChange}
            required
          />
        </div>

        {/* ✅ Ngày về */}
        <div className="col-md-6">
          <label className="form-label">Ngày về</label>
          <input
            type="date"
            className="form-control"
            name="endDate"
            value={tour.endDate}
            onChange={handleChange}
            required
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
            onChange={handleImageChange}
            required
          />
          {previewImage && (
            <img
              src={previewImage}
              alt="Xem trước"
              className="img-thumbnail mt-2"
              style={{ maxWidth: "300px", height: "auto" }}
            />
          )}
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
