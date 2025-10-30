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
    minGroupSize: 0,
    featured: false,
    photo: "",
    photos: [],
    startDate: "",
    endDate: "",
    transportation: "",
    hotelInfo: "",
    activities: [],
    mealsIncluded: [],
    itinerary: [],
    tourGuide: null,
  });

  const [tourGuides, setTourGuides] = useState([]);

  // Inputs tạm cho thêm mới
  const [activityInput, setActivityInput] = useState("");
  const [mealInput, setMealInput] = useState("");
  const [newItinerary, setNewItinerary] = useState({ day: "", title: "", description: "" });

  // Trạng thái chỉnh sửa hiện tại (index + value)
  const [editingActivityIndex, setEditingActivityIndex] = useState(null);
  const [editingActivityValue, setEditingActivityValue] = useState("");

  const [editingMealIndex, setEditingMealIndex] = useState(null);
  const [editingMealValue, setEditingMealValue] = useState("");

  const [editingItineraryIndex, setEditingItineraryIndex] = useState(null);
  const [editingItineraryValue, setEditingItineraryValue] = useState({ day: "", title: "", description: "" });

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [newPhotos, setNewPhotos] = useState([]);
  const [previewPhotos, setPreviewPhotos] = useState([]);

  useEffect(() => {
    // Fetch tour details
    axios
      .get(`http://localhost:4000/api/v1/tour/${id}`)
      .then((res) => {
        const tourData = res.data.data;
        tourData.startDate = tourData.startDate?.substring(0, 10) || "";
        tourData.endDate = tourData.endDate?.substring(0, 10) || "";
        setTour(tourData);
        setPreviewUrl(tourData.photo || "");
        setPreviewPhotos(tourData.photos || []);
      })
      .catch(() => {
        alert("Không tìm thấy tour cần sửa.");
        navigate("/admin/tours");
      });

    // Fetch tour guides
    axios
      .get(`http://localhost:4000/api/v1/tour-guides`)
      .then((res) => {
        setTourGuides(res.data.data || []);
      })
      .catch(() => {
        alert("Lỗi khi tải danh sách hướng dẫn viên.");
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
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePhotosChange = (e) => {
    const files = Array.from(e.target.files);
    setNewPhotos((prev) => [...prev, ...files]);
    setPreviewPhotos((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const handleRemoveOldPhoto = (index) => {
    setTour((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
    setPreviewPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewPhoto = (index) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviewPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Thêm Hoạt động
  const handleAddActivity = () => {
    if (activityInput.trim()) {
      setTour({ ...tour, activities: [...tour.activities, activityInput.trim()] });
      setActivityInput("");
    }
  };

  // Xóa Hoạt động
  const handleRemoveActivity = (index) => {
    setTour({
      ...tour,
      activities: tour.activities.filter((_, i) => i !== index),
    });
    if (editingActivityIndex === index) {
      setEditingActivityIndex(null);
      setEditingActivityValue("");
    }
  };

  // Thêm Bữa ăn
  const handleAddMeal = () => {
    if (mealInput.trim()) {
      setTour({ ...tour, mealsIncluded: [...tour.mealsIncluded, mealInput.trim()] });
      setMealInput("");
    }
  };

  // Xóa Bữa ăn
  const handleRemoveMeal = (index) => {
    setTour({
      ...tour,
      mealsIncluded: tour.mealsIncluded.filter((_, i) => i !== index),
    });
    if (editingMealIndex === index) {
      setEditingMealIndex(null);
      setEditingMealValue("");
    }
  };

  // Thêm Lịch trình
  const handleAddItinerary = () => {
    if (
      newItinerary.day &&
      newItinerary.title.trim() !== "" &&
      newItinerary.description.trim() !== ""
    ) {
      setTour({
        ...tour,
        itinerary: [...tour.itinerary, { ...newItinerary, day: Number(newItinerary.day) }],
      });
      setNewItinerary({ day: "", title: "", description: "" });
    }
  };

  // Xóa Lịch trình
  const handleRemoveItinerary = (index) => {
    setTour({
      ...tour,
      itinerary: tour.itinerary.filter((_, i) => i !== index),
    });
    if (editingItineraryIndex === index) {
      setEditingItineraryIndex(null);
      setEditingItineraryValue({ day: "", title: "", description: "" });
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

      newPhotos.forEach((file) => {
        formData.append("photos", file);
      });

      await axios.put(`http://localhost:4000/api/v1/tour/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      alert("✅ Đã cập nhật tour thành công!");
      navigate("/admin/tours");
    } catch (err) {
      console.error("❌", err);
      alert("❌ Cập nhật thất bại. Kiểm tra dữ liệu hoặc ảnh!");
    }
  };

  return (
    <div>
      <h3>✏️ Sửa Tour</h3>
      <form onSubmit={handleSubmit} className="mt-4 row g-3">
        {/* Các input cơ bản */}
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
            type="number"
            className="form-control"
            name="distance"
            value={tour.distance}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Số người tối đa</label>
          <input
            type="number"
            className="form-control"
            name="maxGroupSize"
            value={tour.maxGroupSize}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Số người tối thiểu</label>
          <input
            type="number"
            className="form-control"
            name="minGroupSize"
            value={tour.minGroupSize}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Giá tour</label>
          <input
            type="number"
            className="form-control"
            name="price"
            value={tour.price}
            onChange={handleChange}
            required
          />
        </div>
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
        {/* Thêm lại 2 input sau */}
        <div className="col-md-6">
          <label className="form-label">Phương tiện di chuyển</label>
          <input
            type="text"
            className="form-control"
            name="transportation"
            value={tour.transportation}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Khách sạn</label>
          <input
            type="text"
            className="form-control"
            name="hotelInfo"
            value={tour.hotelInfo}
            onChange={handleChange}
          />
        </div>
        {/* Nổi bật */}
        <div className="col-md-6">
          <label className="form-label">Nổi bật?</label>
          <select
            className="form-select"
            name="featured"
            value={tour.featured}
            onChange={(e) => setTour({ ...tour, featured: e.target.value === "true" })}
          >
            <option value="false">Không</option>
            <option value="true">Có</option>
          </select>
        </div>

        {/* Hướng dẫn viên */}
        <div className="col-md-6">
          <label className="form-label">Hướng dẫn viên</label>
          <select
            className="form-select"
            name="tourGuide"
            value={tour.tourGuide?._id || ""}
            onChange={(e) => setTour({ ...tour, tourGuide: e.target.value || null })}
          >
            <option value="">-- Chọn hướng dẫn viên --</option>
            {tourGuides.map((guide) => (
              <option key={guide._id} value={guide._id}>
                {guide.name}
              </option>
            ))}
          </select>
        </div>

        {/* Ảnh chính */}
        <div className="col-md-6">
          <label className="form-label">Ảnh chính</label>
          <input type="file" accept="image/*" className="form-control" onChange={handleImageChange} />
          {previewUrl && (
            <img src={previewUrl} alt="Ảnh chính" className="img-thumbnail mt-2" style={{ width: "200px" }} />
          )}
        </div>

        {/* Ảnh phụ cũ */}
        <div className="col-12">
          <label className="form-label">Ảnh phụ hiện tại</label>
          <div className="d-flex flex-wrap gap-2">
            {tour.photos?.map((url, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img src={url} alt={`Old ${i}`} className="img-thumbnail" style={{ width: "100px" }} />
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => handleRemoveOldPhoto(i)}
                  style={{ position: "absolute", top: "-5px", right: "-5px" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Ảnh phụ mới */}
        <div className="col-12">
          <label className="form-label">Thêm ảnh phụ mới</label>
          <input
            type="file"
            accept="image/*"
            className="form-control"
            multiple
            onChange={handlePhotosChange}
          />
          <div className="d-flex flex-wrap gap-2 mt-2">
            {previewPhotos.map((url, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img src={url} alt={`New ${i}`} className="img-thumbnail" style={{ width: "100px" }} />
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => handleRemoveNewPhoto(i)}
                  style={{ position: "absolute", top: "-5px", right: "-5px" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Hoạt động */}
        <div className="col-md-6">
          <label className="form-label">Hoạt động</label>
          <div className="d-flex gap-2 mb-2">
            <input
              type="text"
              className="form-control"
              value={activityInput}
              onChange={(e) => setActivityInput(e.target.value)}
              placeholder="Nhập hoạt động mới..."
            />
            <button type="button" className="btn btn-secondary" onClick={handleAddActivity}>
              +
            </button>
          </div>
          <ul className="list-group">
            {tour.activities.map((act, idx) => (
              <li
                key={idx}
                className="list-group-item d-flex justify-content-between align-items-center"
                onClick={() => {
                  setEditingActivityIndex(idx);
                  setEditingActivityValue(act);
                }}
                style={{ cursor: "pointer" }}
              >
                {editingActivityIndex === idx ? (
                  <>
                    <input
                      type="text"
                      value={editingActivityValue}
                      onChange={(e) => setEditingActivityValue(e.target.value)}
                      className="form-control me-2"
                      style={{ maxWidth: "60%" }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-success me-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (editingActivityValue.trim() !== "") {
                          const updated = [...tour.activities];
                          updated[idx] = editingActivityValue.trim();
                          setTour({ ...tour, activities: updated });
                          setEditingActivityIndex(null);
                        }
                      }}
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingActivityIndex(null);
                      }}
                    >
                      Hủy
                    </button>
                  </>
                ) : (
                  <>
                    <span>{act}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveActivity(idx);
                      }}
                    >
                      x
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Bữa ăn */}
        <div className="col-md-6">
          <label className="form-label">Bữa ăn</label>
          <div className="d-flex gap-2 mb-2">
            <input
              type="text"
              className="form-control"
              value={mealInput}
              onChange={(e) => setMealInput(e.target.value)}
              placeholder="Nhập bữa ăn mới..."
            />
            <button type="button" className="btn btn-secondary" onClick={handleAddMeal}>
              +
            </button>
          </div>
          <ul className="list-group">
            {tour.mealsIncluded.map((meal, idx) => (
              <li
                key={idx}
                className="list-group-item d-flex justify-content-between align-items-center"
                onClick={() => {
                  setEditingMealIndex(idx);
                  setEditingMealValue(meal);
                }}
                style={{ cursor: "pointer" }}
              >
                {editingMealIndex === idx ? (
                  <>
                    <input
                      type="text"
                      value={editingMealValue}
                      onChange={(e) => setEditingMealValue(e.target.value)}
                      className="form-control me-2"
                      style={{ maxWidth: "60%" }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-success me-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (editingMealValue.trim() !== "") {
                          const updated = [...tour.mealsIncluded];
                          updated[idx] = editingMealValue.trim();
                          setTour({ ...tour, mealsIncluded: updated });
                          setEditingMealIndex(null);
                        }
                      }}
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingMealIndex(null);
                      }}
                    >
                      Hủy
                    </button>
                  </>
                ) : (
                  <>
                    <span>{meal}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveMeal(idx);
                      }}
                    >
                      x
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Lịch trình */}
        <div className="col-12">
          <label className="form-label">Lịch trình</label>
          <div className="row g-2 mb-2">
            <div className="col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="Ngày"
                value={newItinerary.day}
                onChange={(e) => setNewItinerary({ ...newItinerary, day: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Tiêu đề"
                value={newItinerary.title}
                onChange={(e) => setNewItinerary({ ...newItinerary, title: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Mô tả"
                value={newItinerary.description}
                onChange={(e) => setNewItinerary({ ...newItinerary, description: e.target.value })}
              />
            </div>
            <div className="col-md-2">
              <button type="button" className="btn btn-primary w-100" onClick={handleAddItinerary}>
                Thêm
              </button>
            </div>
          </div>
          <ul className="list-group">
            {tour.itinerary.map((item, idx) => (
              <li
                key={idx}
                className="list-group-item d-flex justify-content-between align-items-center"
                onClick={() => {
                  setEditingItineraryIndex(idx);
                  setEditingItineraryValue(item);
                }}
                style={{ cursor: "pointer" }}
              >
                {editingItineraryIndex === idx ? (
                  <>
                    <input
                      type="number"
                      value={editingItineraryValue.day}
                      onChange={(e) => setEditingItineraryValue({ ...editingItineraryValue, day: e.target.value })}
                      className="form-control me-1"
                      style={{ maxWidth: "80px" }}
                    />
                    <input
                      type="text"
                      value={editingItineraryValue.title}
                      onChange={(e) => setEditingItineraryValue({ ...editingItineraryValue, title: e.target.value })}
                      className="form-control me-1"
                      style={{ maxWidth: "30%" }}
                    />
                    <input
                      type="text"
                      value={editingItineraryValue.description}
                      onChange={(e) => setEditingItineraryValue({ ...editingItineraryValue, description: e.target.value })}
                      className="form-control me-1"
                      style={{ maxWidth: "40%" }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-success me-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          editingItineraryValue.day &&
                          editingItineraryValue.title.trim() !== "" &&
                          editingItineraryValue.description.trim() !== ""
                        ) {
                          const updated = [...tour.itinerary];
                          updated[idx] = {
                            ...editingItineraryValue,
                            day: Number(editingItineraryValue.day),
                          };
                          setTour({ ...tour, itinerary: updated });
                          setEditingItineraryIndex(null);
                        }
                      }}
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingItineraryIndex(null);
                      }}
                    >
                      Hủy
                    </button>
                  </>
                ) : (
                  <>
                    <span>
                      Ngày {item.day}: {item.title} – {item.description}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItinerary(idx);
                      }}
                    >
                      x
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="col-12">
          <button className="btn btn-primary">Lưu thay đổi</button>
        </div>
      </form>
    </div>
  );
};

export default EditTour;