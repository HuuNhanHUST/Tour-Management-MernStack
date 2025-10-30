import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AddTour = () => {
  const navigate = useNavigate();
  const [tour, setTour] = useState({
    tourGuide: "", // ✅ FIX: Thêm tourGuide vào state ban đầu
    title: "",
    city: "",
    address: "",
    distance: "",
    desc: "",
    price: "",
    maxGroupSize: "",
    minGroupSize: "",
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

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]); // ảnh phụ
  const [photoPreviews, setPhotoPreviews] = useState([]); // preview ảnh phụ
  const [tourGuides, setTourGuides] = useState([]); // ✅ State để lưu danh sách hướng dẫn viên

  // ✅ Fetch danh sách hướng dẫn viên khi component được mount
  useEffect(() => {
    const fetchTourCreationData = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/v1/tour-guides", {
          withCredentials: true,
        });
        // ✅ FIX: Đảm bảo _id là string để select hoạt động đúng
        setTourGuides(res.data.data.map(guide => ({ ...guide, _id: guide._id.toString() })));
      } catch (err) {
        console.error("Lỗi khi lấy danh sách hướng dẫn viên:", err);
      }
    };
    fetchTourCreationData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ["distance", "price", "maxGroupSize", "minGroupSize"];
    
    // Chỉ áp dụng logic xử lý số cho các trường cụ thể
    // ✅ FIX: Tách biệt logic cho trường số và các trường khác để tránh lỗi
    if (numericFields.includes(name)) {
      // Xử lý cho trường số: loại bỏ số 0 ở đầu
      const sanitizedValue = value.replace(/^0+(?=\d)/, '');
      setTour({ ...tour, [name]: sanitizedValue });
    } else {
      // Xử lý cho các trường còn lại (text, select, date, v.v.)
      // Cập nhật giá trị một cách bình thường
      setTour({ ...tour, [name]: value });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handlePhotosChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotoFiles(prev => [...prev, ...files]);
    setPhotoPreviews(prev => [...prev, ...files.map(file => URL.createObjectURL(file))]);
  };

  const handleRemovePhoto = (index) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddActivity = () => {
    if (activityInput.trim()) {
      setTour({ ...tour, activities: [...tour.activities, activityInput.trim()] });
      setActivityInput("");
    }
  };

  const handleAddMeal = () => {
    if (mealInput.trim()) {
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

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      photoFiles.forEach((file) => {
        formData.append("photos", file);
      });

      await axios.post("http://localhost:4000/api/v1/tours", formData, { // ✅ FIX: Sửa endpoint từ /tour thành /tours
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      alert("✅ Thêm tour thành công!");
      navigate("/admin/tours");
    } catch (err) {
      console.error("❌ Upload thất bại:", err);
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
          <input type="text" className="form-control" name="distance" value={tour.distance} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Số người tối đa</label>
          <input type="text" className="form-control" name="maxGroupSize" value={tour.maxGroupSize} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Số người tối thiểu</label>
          <input type="text" className="form-control" name="minGroupSize" value={tour.minGroupSize} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Giá tour</label>
          <input type="text" className="form-control" name="price" value={tour.price} onChange={handleChange} required />
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

        {/* ✅ UI: Thêm dropdown chọn hướng dẫn viên */}
        <div className="col-md-6">
          <label className="form-label">Hướng dẫn viên</label>
          <select
            className="form-select"
            name="tourGuide"
            value={tour.tourGuide}
            onChange={handleChange}
          >
            <option value="">-- Chọn hướng dẫn viên --</option>
            {tourGuides.map((guide) => (
              <option key={guide._id} value={guide._id.toString()}>
                {guide.name}
              </option>
            ))}
          </select>
        </div>

        {/* Ảnh chính */}
        <div className="col-md-6">
          <label className="form-label">Ảnh chính</label>
          <input type="file" accept="image/*" className="form-control" onChange={handleImageChange} required />
          {photoPreview && <img src={photoPreview} alt="Ảnh chính" className="img-thumbnail mt-2" style={{ maxWidth: "200px" }} />}
        </div>

        {/* Ảnh phụ + xóa */}
        <div className="col-md-6">
          <label className="form-label">Ảnh phụ (chọn nhiều lần được)</label>
          <input type="file" accept="image/*" className="form-control" multiple onChange={handlePhotosChange} />
          <div className="d-flex flex-wrap gap-2 mt-2">
            {photoPreviews.map((url, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img src={url} alt={`Ảnh phụ ${i}`} className="img-thumbnail" style={{ width: "100px" }} />
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Xóa"
                  onClick={() => handleRemovePhoto(i)}
                  style={{ position: "absolute", top: "-5px", right: "-5px" }}
                ></button>
              </div>
            ))}
          </div>
        </div>

        {/* Mô tả và các trường nâng cao */}
        <div className="col-12">
          <label className="form-label">Mô tả</label>
          <textarea className="form-control" name="desc" rows="3" value={tour.desc} onChange={handleChange} required></textarea>
        </div>
        <div className="col-md-6">
          <label className="form-label">Phương tiện di chuyển</label>
          <input type="text" className="form-control" name="transportation" value={tour.transportation} onChange={handleChange} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Khách sạn</label>
          <input type="text" className="form-control" name="hotelInfo" value={tour.hotelInfo} onChange={handleChange} />
        </div>

        {/* Hoạt động + Bữa ăn */}
        <div className="col-md-6">
          <label className="form-label">Thêm hoạt động</label>
          <div className="d-flex gap-2">
            <input type="text" className="form-control" value={activityInput} onChange={(e) => setActivityInput(e.target.value)} />
            <button type="button" className="btn btn-secondary" onClick={handleAddActivity}>+</button>
          </div>
          <ul>{tour.activities.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </div>
        <div className="col-md-6">
          <label className="form-label">Thêm bữa ăn</label>
          <div className="d-flex gap-2">
            <input type="text" className="form-control" value={mealInput} onChange={(e) => setMealInput(e.target.value)} />
            <button type="button" className="btn btn-secondary" onClick={handleAddMeal}>+</button>
          </div>
          <ul>{tour.mealsIncluded.map((m, i) => <li key={i}>{m}</li>)}</ul>
        </div>

        {/* Lịch trình */}
        <div className="col-12">
          <label className="form-label">Lịch trình</label>
          <div className="row g-2">
            <div className="col-md-2"><input type="number" placeholder="Ngày" className="form-control" value={newItinerary.day} onChange={(e) => setNewItinerary({ ...newItinerary, day: e.target.value })} /></div>
            <div className="col-md-4"><input type="text" placeholder="Tiêu đề" className="form-control" value={newItinerary.title} onChange={(e) => setNewItinerary({ ...newItinerary, title: e.target.value })} /></div>
            <div className="col-md-4"><input type="text" placeholder="Mô tả" className="form-control" value={newItinerary.description} onChange={(e) => setNewItinerary({ ...newItinerary, description: e.target.value })} /></div>
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
