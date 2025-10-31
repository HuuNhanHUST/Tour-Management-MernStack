import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const EditTourGuide = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tourGuide, setTourGuide] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    languages: [],
    experience: 0,
  });

  const [languageInput, setLanguageInput] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    const fetchTourGuide = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/api/v1/tour-guides/${id}`, {
          withCredentials: true,
        });
        const data = response.data.data;
        setTourGuide({
            ...data,
            languages: data.languages || [] // Ensure languages is an array
        });
        setPhotoPreview(data.photo ? `http://localhost:4000/${data.photo}` : null);
      } catch (err) {
        console.error("❌ Lỗi khi tải dữ liệu hướng dẫn viên:", err);
        alert("Không thể tải dữ liệu.");
      }
    };
    fetchTourGuide();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTourGuide({ ...tourGuide, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleAddLanguage = () => {
    if (languageInput.trim()) {
      setTourGuide({
        ...tourGuide,
        languages: [...tourGuide.languages, languageInput.trim()],
      });
      setLanguageInput("");
    }
  };

  const handleRemoveLanguage = (index) => {
    setTourGuide({
        ...tourGuide,
        languages: tourGuide.languages.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
       for (const key in tourGuide) {
        if (key === 'photo' || key === '_id' || key === '__v') continue;
        if (Array.isArray(tourGuide[key])) {
            formData.append(key, JSON.stringify(tourGuide[key]));
        } else {
            formData.append(key, tourGuide[key]);
        }
      }

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      await axios.put(`http://localhost:4000/api/v1/tour-guides/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      alert("✅ Cập nhật hướng dẫn viên thành công!");
      navigate("/admin/tour-guides");
    } catch (err) {
      console.error("❌ Cập nhật thất bại:", err);
      alert("❌ Cập nhật thất bại. Kiểm tra lại dữ liệu!");
    }
  };

  return (
    <div>
      <h3>✏️ Chỉnh sửa Hướng dẫn viên</h3>
      <form onSubmit={handleSubmit} className="mt-4 row g-3">
        <div className="col-md-6">
          <label className="form-label">Tên</label>
          <input type="text" className="form-control" name="name" value={tourGuide.name} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Email</label>
          <input type="email" className="form-control" name="email" value={tourGuide.email} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Điện thoại</label>
          <input type="text" className="form-control" name="phone" value={tourGuide.phone} onChange={handleChange} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Kinh nghiệm (năm)</label>
          <input type="number" className="form-control" name="experience" value={tourGuide.experience} onChange={handleChange} />
        </div>
        <div className="col-12">
          <label className="form-label">Tiểu sử</label>
          <textarea className="form-control" name="bio" rows="3" value={tourGuide.bio} onChange={handleChange}></textarea>
        </div>
        
        <div className="col-md-6">
          <label className="form-label">Ảnh đại diện</label>
          <input type="file" accept="image/*" className="form-control" onChange={handleImageChange} />
          {photoPreview && <img src={photoPreview} alt="Preview" className="img-thumbnail mt-2" style={{ maxWidth: "200px" }} />}
        </div>

        <div className="col-md-6">
          <label className="form-label">Thêm ngôn ngữ</label>
          <div className="d-flex gap-2">
            <input type="text" className="form-control" value={languageInput} onChange={(e) => setLanguageInput(e.target.value)} />
            <button type="button" className="btn btn-secondary" onClick={handleAddLanguage}>+</button>
          </div>
          <ul className="d-flex flex-wrap gap-2 mt-2">
            {tourGuide.languages.map((lang, i) => (
                <li key={i} className="badge bg-primary d-flex align-items-center">
                    {lang}
                    <button type="button" className="btn-close btn-close-white ms-2" onClick={() => handleRemoveLanguage(i)}></button>
                </li>
            ))}
            </ul>
        </div>

        <div className="col-12">
          <button type="submit" className="btn btn-primary">Cập nhật</button>
        </div>
      </form>
    </div>
  );
};

export default EditTourGuide;
