import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const EditTour = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tour, setTour] = useState({
    title: "",
    city: "",
    address: "",
    distance: 0,
    desc: "",
    price: 0,
    maxGroupSize: 0,
    featured: false,
    photo: ""
  });

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    axios
      .get(`http://localhost:4000/api/v1/tour/${id}`)
      .then((res) => {
        const tourData = res.data.data;
        setTour(tourData);
        setPreviewUrl(`http://localhost:4000/uploads/${tourData.photo}`);
      })
      .catch(() => {
        alert("Không tìm thấy tour cần sửa.");
        navigate("/admin/tours");
      });
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setTour({
      ...tour,
      [name]: type === "number" ? Number(value) : value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (imageFile) {
        const formData = new FormData();
        for (const key in tour) {
          formData.append(key, tour[key]);
        }
        formData.append("photo", imageFile);

        await axios.put(`http://localhost:4000/api/v1/tour/${id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          },
          withCredentials: true
        });
      } else {
        await axios.put(`http://localhost:4000/api/v1/tour/${id}`, tour, {
          withCredentials: true
        });
      }

      alert("✅ Đã cập nhật tour thành công!");
      navigate("/admin/tours");
    } catch (err) {
      console.error(err);
      alert("❌ Cập nhật thất bại. Kiểm tra dữ liệu hoặc ảnh!");
    }
  };

  return (
    <div>
      <h3>✏️ Sửa Tour</h3>
      <form onSubmit={handleSubmit} className="mt-4 row g-3">
        <div className="col-md-6">
          <label className="form-label">Tên tour</label>
          <input type="text" className="form-control" name="title" value={tour.title} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Thành phố</label>
          <input type="text" className="form-control" name="city" value={tour.city} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Địa chỉ</label>
          <input type="text" className="form-control" name="address" value={tour.address} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Khoảng cách (km)</label>
          <input type="number" className="form-control" name="distance" value={tour.distance} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Số người tối đa</label>
          <input type="number" className="form-control" name="maxGroupSize" value={tour.maxGroupSize} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Giá tour</label>
          <input type="number" className="form-control" name="price" value={tour.price} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Nổi bật?</label>
          <select className="form-select" name="featured" value={tour.featured} onChange={(e) => setTour({ ...tour, featured: e.target.value === "true" })}>
            <option value="false">Không</option>
            <option value="true">Có</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Ảnh mới (nếu muốn thay)</label>
          <input type="file" accept="image/*" className="form-control" onChange={handleImageChange} />
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="img-thumbnail mt-2" style={{ height: "150px", objectFit: "cover" }} />
          )}
        </div>
        <div className="col-12">
          <label className="form-label">Mô tả</label>
          <textarea className="form-control" name="desc" rows="3" value={tour.desc} onChange={handleChange} required></textarea>
        </div>
        <div className="col-12">
          <button className="btn btn-primary">Lưu thay đổi</button>
        </div>
      </form>
    </div>
  );
};

export default EditTour;
