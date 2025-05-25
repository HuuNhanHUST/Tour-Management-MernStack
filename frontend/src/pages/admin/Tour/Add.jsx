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
    minGroupSize: "", // ✅ Thêm mới
    featured: false,
    startDate: "",
    endDate: "",
    transportation: "",
    hotelInfo: "",
    activities: [],
    mealsIncluded: [],
    itinerary: [],
  });

  const [activityInput, setActivityInput] = useState("");
  const [mealInput, setMealInput] = useState("");
  const [newItinerary, setNewItinerary] = useState({ day: "", title: "", description: "" });

  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let newValue = value;

    if (type === "text" && ["distance", "price", "maxGroupSize", "minGroupSize"].includes(name)) {
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

  const handleAddActivity = () => {
    if (activityInput.trim() !== "") {
      setTour({ ...tour, activities: [...tour.activities, activityInput.trim()] });
      setActivityInput("");
    }
  };

  const handleAddMeal = () => {
    if (mealInput.trim() !== "") {
      setTour({ ...tour, mealsIncluded: [...tour.mealsIncluded, mealInput.trim()] });
      setMealInput("");
    }
  };

  const handleAddItinerary = () => {
    if (newItinerary.day && newItinerary.title && newItinerary.description) {
      setTour({
        ...tour,
        itinerary: [...tour.itinerary, { ...newItinerary, day: Number(newItinerary.day) }],
      });
      setNewItinerary({ day: "", title: "", description: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      for (const key in tour) {
        if (Array.isArray(tour[key])) {
          formData.append(key, JSON.stringify(tour[key]));
        } else {
          formData.append(key, tour[key]);
        }
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
        {/* Thông tin cơ bản */}
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
          <input type="text" className="form-control" name="distance" value={tour.distance} onChange={handleChange} required inputMode="numeric" pattern="[0-9]*" />
        </div>
        <div className="col-md-6">
          <label className="form-label">Số người tối đa</label>
          <input type="text" className="form-control" name="maxGroupSize" value={tour.maxGroupSize} onChange={handleChange} required inputMode="numeric" pattern="[0-9]*" />
        </div>
        <div className="col-md-6">
          <label className="form-label">Số người tối thiểu</label>
          <input type="text" className="form-control" name="minGroupSize" value={tour.minGroupSize} onChange={handleChange} required inputMode="numeric" pattern="[0-9]*" />
        </div>
        <div className="col-md-6">
          <label className="form-label">Giá tour</label>
          <input type="text" className="form-control" name="price" value={tour.price} onChange={handleChange} required inputMode="numeric" pattern="[0-9]*" />
        </div>
        <div className="col-md-6">
          <label className="form-label">Ngày đi</label>
          <input type="date" className="form-control" name="startDate" value={tour.startDate} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Ngày về</label>
          <input type="date" className="form-control" name="endDate" value={tour.endDate} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Nổi bật?</label>
          <select className="form-select" name="featured" value={tour.featured} onChange={(e) => setTour({ ...tour, featured: e.target.value === "true" })}>
            <option value="false">Không</option>
            <option value="true">Có</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Ảnh (chọn từ máy)</label>
          <input type="file" accept="image/*" className="form-control" onChange={handleImageChange} required />
          {previewImage && (
            <img src={previewImage} alt="Xem trước" className="img-thumbnail mt-2" style={{ maxWidth: "300px", height: "auto" }} />
          )}
        </div>
        <div className="col-12">
          <label className="form-label">Mô tả</label>
          <textarea className="form-control" name="desc" rows="3" value={tour.desc} onChange={handleChange} required></textarea>
        </div>

        {/* Các trường nâng cao */}
        <div className="col-md-6">
          <label className="form-label">Phương tiện di chuyển</label>
          <input type="text" className="form-control" name="transportation" value={tour.transportation} onChange={handleChange} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Khách sạn</label>
          <input type="text" className="form-control" name="hotelInfo" value={tour.hotelInfo} onChange={handleChange} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Thêm hoạt động</label>
          <div className="d-flex gap-2">
            <input type="text" className="form-control" value={activityInput} onChange={(e) => setActivityInput(e.target.value)} />
            <button type="button" className="btn btn-secondary" onClick={handleAddActivity}>+</button>
          </div>
          <ul className="mt-2">{tour.activities.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </div>
        <div className="col-md-6">
          <label className="form-label">Thêm bữa ăn</label>
          <div className="d-flex gap-2">
            <input type="text" className="form-control" value={mealInput} onChange={(e) => setMealInput(e.target.value)} />
            <button type="button" className="btn btn-secondary" onClick={handleAddMeal}>+</button>
          </div>
          <ul className="mt-2">{tour.mealsIncluded.map((m, i) => <li key={i}>{m}</li>)}</ul>
        </div>
        <div className="col-12">
          <label className="form-label">Lịch trình (Thêm từng ngày)</label>
          <div className="row g-2">
            <div className="col-md-2"><input type="number" className="form-control" placeholder="Ngày" value={newItinerary.day} onChange={(e) => setNewItinerary({ ...newItinerary, day: e.target.value })} /></div>
            <div className="col-md-4"><input type="text" className="form-control" placeholder="Tiêu đề" value={newItinerary.title} onChange={(e) => setNewItinerary({ ...newItinerary, title: e.target.value })} /></div>
            <div className="col-md-4"><input type="text" className="form-control" placeholder="Mô tả" value={newItinerary.description} onChange={(e) => setNewItinerary({ ...newItinerary, description: e.target.value })} /></div>
            <div className="col-md-2"><button type="button" className="btn btn-primary w-100" onClick={handleAddItinerary}>Thêm</button></div>
          </div>
          <ul className="mt-2">{tour.itinerary.map((item, i) => <li key={i}>Ngày {item.day}: {item.title} – {item.description}</li>)}</ul>
        </div>

        <div className="col-12">
          <button className="btn btn-success">Thêm Tour</button>
        </div>
      </form>
    </div>
  );
};

export default AddTour;
