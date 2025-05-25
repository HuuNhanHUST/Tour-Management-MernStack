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
    minGroupSize: 0, // ✅ Thêm mới
    featured: false,
    photo: "",
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
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    axios
      .get(`http://localhost:4000/api/v1/tour/${id}`)
      .then((res) => {
        const tourData = res.data.data;
        tourData.startDate = tourData.startDate?.substring(0, 10) || "";
        tourData.endDate = tourData.endDate?.substring(0, 10) || "";

        setTour(tourData);

        const imageURL =
          tourData.photo?.startsWith("http") ||
          tourData.photo?.startsWith("data:") ||
          tourData.photo?.startsWith("/tour-images")
            ? tourData.photo
            : `http://localhost:4000/uploads/${tourData.photo}`;

        setPreviewUrl(imageURL);
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
      [name]: type === "number" ? Number(value) : value,
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
      if (imageFile) {
        formData.append("photo", imageFile);
      }

      await axios.put(`http://localhost:4000/api/v1/tour/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

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
        <div className="col-md-6"><label className="form-label">Tên tour</label><input type="text" className="form-control" name="title" value={tour.title} onChange={handleChange} required /></div>
        <div className="col-md-6"><label className="form-label">Thành phố</label><input type="text" className="form-control" name="city" value={tour.city} onChange={handleChange} required /></div>
        <div className="col-md-6"><label className="form-label">Địa chỉ</label><input type="text" className="form-control" name="address" value={tour.address} onChange={handleChange} required /></div>
        <div className="col-md-6"><label className="form-label">Khoảng cách (km)</label><input type="number" className="form-control" name="distance" value={tour.distance} onChange={handleChange} required /></div>
        <div className="col-md-6"><label className="form-label">Số người tối đa</label><input type="number" className="form-control" name="maxGroupSize" value={tour.maxGroupSize} onChange={handleChange} required /></div>
        <div className="col-md-6"><label className="form-label">Số người tối thiểu</label><input type="number" className="form-control" name="minGroupSize" value={tour.minGroupSize} onChange={handleChange} required /></div>
        <div className="col-md-6"><label className="form-label">Giá tour</label><input type="number" className="form-control" name="price" value={tour.price} onChange={handleChange} required /></div>
        <div className="col-md-6"><label className="form-label">Ngày khởi hành</label><input type="date" className="form-control" name="startDate" value={tour.startDate} onChange={handleChange} required /></div>
        <div className="col-md-6"><label className="form-label">Ngày kết thúc</label><input type="date" className="form-control" name="endDate" value={tour.endDate} onChange={handleChange} required /></div>
        <div className="col-md-6"><label className="form-label">Nổi bật?</label>
          <select className="form-select" name="featured" value={tour.featured} onChange={(e) => setTour({ ...tour, featured: e.target.value === "true" })}>
            <option value="false">Không</option>
            <option value="true">Có</option>
          </select>
        </div>
        <div className="col-md-6"><label className="form-label">Ảnh mới (nếu muốn thay)</label>
          <input type="file" accept="image/*" className="form-control" onChange={handleImageChange} />
          {previewUrl && <img src={previewUrl} alt="Preview" className="img-thumbnail mt-2" style={{ height: "150px", objectFit: "cover" }} />}
        </div>
        <div className="col-12"><label className="form-label">Mô tả</label><textarea className="form-control" name="desc" rows="3" value={tour.desc} onChange={handleChange} required></textarea></div>

        {/* Các trường nâng cao */}
        <div className="col-md-6"><label className="form-label">Phương tiện</label><input type="text" className="form-control" name="transportation" value={tour.transportation} onChange={handleChange} /></div>
        <div className="col-md-6"><label className="form-label">Khách sạn</label><input type="text" className="form-control" name="hotelInfo" value={tour.hotelInfo} onChange={handleChange} /></div>
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
          <label className="form-label">Lịch trình</label>
          <div className="row g-2">
            <div className="col-md-2"><input type="number" className="form-control" placeholder="Ngày" value={newItinerary.day} onChange={(e) => setNewItinerary({ ...newItinerary, day: e.target.value })} /></div>
            <div className="col-md-4"><input type="text" className="form-control" placeholder="Tiêu đề" value={newItinerary.title} onChange={(e) => setNewItinerary({ ...newItinerary, title: e.target.value })} /></div>
            <div className="col-md-4"><input type="text" className="form-control" placeholder="Mô tả" value={newItinerary.description} onChange={(e) => setNewItinerary({ ...newItinerary, description: e.target.value })} /></div>
            <div className="col-md-2"><button type="button" className="btn btn-primary w-100" onClick={handleAddItinerary}>Thêm</button></div>
          </div>
          <ul className="mt-2">{tour.itinerary.map((item, i) => <li key={i}>Ngày {item.day}: {item.title} – {item.description}</li>)}</ul>
        </div>

        <div className="col-12">
          <button className="btn btn-primary">Lưu thay đổi</button>
        </div>
      </form>
    </div>
  );
};

export default EditTour;
