import React, { useEffect, useRef, useState, useContext, useMemo } from "react";
import "../styles/enhanced-tour-details.css";
import "../styles/enhanced-reviews.css";
import "../styles/enhanced-layout.css";
import "../styles/pricing-summary.css";
import { Container, Row, Col, Form } from "reactstrap";
import { useParams } from "react-router-dom";
import caculateAvgRating from "../utils/avgRating";
import avatar from "../assets/images/avatar.jpg";
import MultiStepBooking from "../components/Booking/MultiStepBooking";
import ThongTinGiaTour from "../components/Booking/ThongTinGiaTour";
import Newsletter from "../shared/Newsleter";
import useFetch from "../hooks/useFetch";
import { BASE_URL } from "../utils/config";
import { AuthContext } from "../context/AuthContext";

const TourDetails = () => {
  const { id } = useParams();
  const reviewMsgRef = useRef("");
  const [tourRating, setTourRating] = useState(null);
  const [userReview, setUserReview] = useState(null);
  const { user } = useContext(AuthContext);
  const { data: tourResponse, loading, error } = useFetch(`${BASE_URL}/tour/${id}`);
  const tour = tourResponse?.data;
  const similarTours = useMemo(() => tourResponse?.similarTours || [], [tourResponse]);
  
  // Debug thông tin tour và tour tương tự
  useEffect(() => {
    if (tourResponse) {
      console.log("Tour response:", tourResponse);
      console.log("Tour data:", tour);
      console.log("Similar tours:", similarTours);
      console.log("Tour city:", tour?.city);
    }
  }, [tourResponse, tour, similarTours]);
  const { totalRating, avgRating } = caculateAvgRating(tour?.reviews || []);
  const options = { day: "numeric", month: "long", year: "numeric" };

  const [mainImage, setMainImage] = useState(null);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    if (tour && user) {
      const existing = tour.reviews?.find((r) => r.username === user.username);
      if (existing) {
        setUserReview(existing);
        reviewMsgRef.current.value = existing.reviewText;
        setTourRating(existing.rating);
      }
    }

    if (tour?.photo) {
      const defaultPhoto = tour.photo.startsWith("http")
        ? tour.photo
        : "https://via.placeholder.com/800x400?text=No+Image";
      setMainImage(defaultPhoto);
      setPhotos(tour.photos?.filter((p) => p !== defaultPhoto) || []);
    }
  }, [tour, user]);

  const submitHandler = async (e) => {
    e.preventDefault();
    const reviewText = reviewMsgRef.current.value;

    if (!user) return alert("Vui lòng đăng nhập để đánh giá!");
    if (!tourRating) return alert("Vui lòng chọn số sao!");

    const reviewObj = { reviewText, rating: tourRating };

    try {
      const res = await fetch(`${BASE_URL}/review/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(reviewObj),
      });

      const result = await res.json();
      if (!res.ok) return alert(result.message || "Gửi đánh giá thất bại!");
      alert(userReview ? "✅ Cập nhật đánh giá thành công!" : "✅ Gửi đánh giá thành công!");
      
      // Smooth reload: Delay để user đọc message, sau đó reload
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Đã có lỗi xảy ra khi gửi đánh giá.");
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (loading) return <h4 className="text-center pt-5">Đang tải dữ liệu...</h4>;
  if (error || !tour) return <h4 className="text-center pt-5">Không tìm thấy tour</h4>;

  const {
    title,
    desc,
    price,
    address,
    reviews,
    city,
    distance,
    maxGroupSize,
    minGroupSize,
    currentBookings,
    startDate,
    endDate,
    transportation,
    hotelInfo,
    mealsIncluded,
    activities,
    itinerary,
  } = tour;

  const availableSlots = maxGroupSize - currentBookings;
  const isTourExpired = new Date() > new Date(endDate);
  const isTourStarted = new Date() >= new Date(startDate);
  const handleImageClick = (clickedUrl) => {
    setPhotos((prev) => {
      const newPhotos = [mainImage, ...prev.filter((p) => p !== clickedUrl)];
      return newPhotos;
    });
    setMainImage(clickedUrl);
  };

  return (
    <>
      <section>
        <Container>
          <Row>
            <Col lg="8">
              <div className="tour__content">
                <div className="tour__details-header shadow-sm">
                  <div className="tour__title-section">
                    <h2 className="tour-title">{title}</h2>
                    <div className="d-flex align-items-center gap-3 tour-meta">
                      <span className="tour__rating d-flex align-items-center gap-1">
                        <i className="ri-star-fill" style={{ color: "#ffc107" }}></i>
                        {avgRating === 0 ? "Chưa có đánh giá" : <span>{avgRating}</span>}
                        {totalRating !== 0 && <span>({reviews?.length} đánh giá)</span>}
                      </span>
                      <span className="location-badge">
                        <i className="ri-map-pin-fill"></i> {address}
                      </span>
                      <span className="tour-city-badge">
                        <i className="ri-building-line"></i> {city}
                      </span>
                    </div>
                  
                    {/* Tour Status */}
                    <div className="mt-3">
                      {isTourExpired ? (
                        <div className="tour__status expired">
                          <i className="ri-error-warning-fill me-2"></i>
                          Tour đã kết thúc
                        </div>
                      ) : availableSlots <= 0 ? (
                        <div className="tour__status sold-out">
                          <i className="ri-close-circle-fill me-2"></i>
                          Hết chỗ
                        </div>
                      ) : availableSlots < 5 ? (
                        <div className="tour__status limited">
                          <i className="ri-alarm-warning-fill me-2"></i>
                          Còn {availableSlots} chỗ
                        </div>
                      ) : (
                        <div className="tour__status available">
                          <i className="ri-check-line me-2"></i>
                          Còn nhận đặt tour
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tour Image Gallery */}
                <div className="tour__gallery-section">
                  <div className="main-image-container">
                    {mainImage && (
                      <img
                        src={mainImage}
                        alt={title}
                        className="main-tour-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/800x400?text=No+Image";
                        }}
                      />
                    )}
                  </div>

                  {/* Thumbnails */}
                  {photos.length > 0 && (
                    <div className="photo-gallery">
                      {photos.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Ảnh phụ ${i}`}
                          className="gallery-thumbnail"
                          onClick={() => handleImageClick(url)}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/100x70?text=Error";
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="tour-details-grid">
                  {/* Thông tin cơ bản */}
                  <div className="tour__info shadow-sm">
                    <div className="tour-info-header">
                      <i className="ri-information-line info-icon"></i>
                      <h4>Thông tin cơ bản</h4>
                    </div>
                    
                    <div className="tour__extra-details">
                      {/* Tour Metadata */}
                      <div className="tour__details-meta">
                        <span><i className="ri-map-pin-2-line"></i> <strong>Thành phố:</strong> {city}</span>
                        <span><i className="ri-money-dollar-circle-line"></i> <strong>Giá cơ bản:</strong> ${price}/người</span>
                        <span><i className="ri-map-pin-time-line"></i> <strong>Khoảng cách:</strong> {distance} km</span>
                        <span><i className="ri-group-line"></i> <strong>Sức chứa:</strong> {maxGroupSize} người</span>
                        <span><i className="ri-group-line"></i> <strong>Đã đặt:</strong> {currentBookings} người</span>
                        <span><i className="ri-calendar-todo-line"></i> <strong>Ngày đi:</strong> {startDate ? new Date(startDate).toLocaleDateString("vi-VN") : "-"}</span>
                        <span><i className="ri-calendar-check-line"></i> <strong>Ngày về:</strong> {endDate ? new Date(endDate).toLocaleDateString("vi-VN") : "-"}</span>
                      </div>
                    </div>
                  
                    {!isTourStarted && minGroupSize > 1 && currentBookings < minGroupSize && (
                      <div className="tour__warning mt-3">
                        <i className="ri-error-warning-line me-2"></i>
                        Tour yêu cầu tối thiểu {minGroupSize} người. Hiện tại mới có {currentBookings} người – tour có thể bị hủy nếu không đủ!
                      </div>
                    )}
                  </div>
                  
                  {/* Mô tả */}
                  <div className="tour__info shadow-sm">
                    <div className="tour-info-header">
                      <i className="ri-file-text-line info-icon"></i>
                      <h4>Chi tiết tour</h4>
                    </div>
                    <h5 className="mt-3">Mô tả</h5>
                    <p>{desc}</p>

                    <h5 className="mt-4">Phương tiện di chuyển</h5>
                    <p>{transportation || "Không có thông tin"}</p>

                    <h5 className="mt-4">Thông tin khách sạn</h5>
                    <p>{hotelInfo || "Không có thông tin"}</p>
                  </div>
                  
                  {/* Thông tin chi tiết */}
                  <div className="tour__info shadow-sm">
                    <div className="tour-info-header">
                      <i className="ri-restaurant-line info-icon"></i>
                      <h4>Dịch vụ bao gồm</h4>
                    </div>
                    
                    <h5 className="mt-3">Bữa ăn bao gồm</h5>
                    <ul className="services-list">{mealsIncluded?.length > 0 ? mealsIncluded.map((meal, i) => <li key={i}>{meal}</li>) : <li>Không có thông tin</li>}</ul>

                    <h5 className="mt-4">Các hoạt động trong tour</h5>
                    <ul className="services-list">{activities?.length > 0 ? activities.map((act, i) => <li key={i}>{act}</li>) : <li>Không có thông tin</li>}</ul>
                  </div>

                  {/* Hiển thị thông tin giá */}
                  <div className="tour__info shadow-sm pricing-highlight">
                    <div className="tour-info-header pricing-header">
                      <i className="ri-money-dollar-circle-line info-icon pricing-icon"></i>
                      <h4>Thông tin giá vé</h4>
                    </div>
                    
                    <div className="pricing-table-container">
                      <div className="pricing-table-header">
                        <h5>Chi tiết giá</h5>
                      </div>
                      
                      <div className="tour__pricing-details">
                        <ThongTinGiaTour tourId={id} basePrice={price} />
                      </div>
                    </div>
                  </div>

                  {/* Lịch trình */}
                  <div className="tour__info shadow-sm">
                    <div className="tour-info-header">
                      <i className="ri-calendar-todo-line info-icon"></i>
                      <h4>Lịch trình tour</h4>
                    </div>
                    <div className="mt-3">
                      {itinerary && Array.isArray(itinerary) && itinerary.length > 0 ? itinerary.map((item, i) => {
                        if (!item) return null;
                        return (
                          <div key={i} className="mb-4 itinerary-day">
                            <h6>Ngày {item.day || i + 1}: {item.title || "Chưa có tiêu đề"}</h6>
                            <p>{item.description || "Chưa có mô tả"}</p>
                          </div>
                        );
                      }) : <p>Không có lịch trình chi tiết.</p>}
                    </div>
                  </div>

                  {/* Đánh giá */}
                  <div className="tour__info shadow-sm">
                    <div className="tour-info-header">
                      <i className="ri-star-line info-icon"></i>
                      <h4>Đánh giá ({reviews?.length || 0})</h4>
                    </div>
                    
                    {/* Tổng quan đánh giá */}
                    <div className="review-summary-container">
                      <h3 className="review-summary-title">
                        ĐIỂM ĐÁNH GIÁ TỪ NGƯỜI ĐI DU LỊCH {" "}
                        <span className="d-inline-flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <i key={star} className="ri-star-fill star-icon"></i>
                          ))}
                        </span>
                      </h3>
                      
                      {/* Rating bars */}
                      <div className="rating-breakdown">
                        {[
                          { label: "TUYỆT VỜI", rating: 5, count: (reviews && Array.isArray(reviews)) ? reviews.filter(r => r?.rating === 5).length : 0 },
                          { label: "Very good", rating: 4, count: (reviews && Array.isArray(reviews)) ? reviews.filter(r => r?.rating === 4).length : 0 },
                          { label: "Good", rating: 3, count: (reviews && Array.isArray(reviews)) ? reviews.filter(r => r?.rating === 3).length : 0 },
                          { label: "Average", rating: 2, count: (reviews && Array.isArray(reviews)) ? reviews.filter(r => r?.rating === 2).length : 0 },
                          { label: "Poor", rating: 1, count: (reviews && Array.isArray(reviews)) ? reviews.filter(r => r?.rating === 1).length : 0 }
                        ].map((item, index) => {
                          const percentage = (reviews && Array.isArray(reviews) && reviews.length > 0) ? (item.count / reviews.length) * 100 : 0;
                          return (
                            <div key={index} className="rating-row">
                              <div className="rating-label">{item.label}</div>
                              <div className="rating-stars">
                                {Array(5).fill(null).map((_, i) => (
                                  <i 
                                    key={i} 
                                    className={i < item.rating ? "ri-star-fill" : "ri-star-fill empty"}
                                  ></i>
                                ))}
                              </div>
                              <div className="rating-bar-container">
                                <div className="rating-bar" style={{ width: `${percentage}%` }}></div>
                              </div>
                              <div className="rating-count">{item.count}</div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="rating-buttons">
                        <button className="rating-btn" onClick={() => document.getElementById('write-review').scrollIntoView({behavior: 'smooth'})}>
                          Đánh giá
                        </button>
                      </div>
                    </div>
                    
                    {/* Viết đánh giá */}
                    <div id="write-review" className="mt-4">
                      <h4 className="mb-3">Viết đánh giá của bạn</h4>
                      <Form onSubmit={submitHandler} className="mt-3">
                        <div className="d-flex align-items-center gap-3 mb-4 rating__group">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              onClick={() => setTourRating(star)}
                              className={tourRating === star ? "selected" : ""}
                              style={{ cursor: "pointer" }}
                            >
                              {star}
                              <i className="ri-star-s-fill"></i>
                            </span>
                          ))}
                        </div>
                        <div className="review__input">
                          <input type="text" ref={reviewMsgRef} placeholder="Chia sẻ cảm nhận của bạn..." required />
                          <button className="btn primary__btn text-white" type="submit">
                            {userReview ? "Cập nhật đánh giá" : "Gửi đánh giá"}
                          </button>
                        </div>
                      </Form>
                    </div>
                    
                    {/* Danh sách đánh giá */}
                    <div className="mt-4">
                      <h4 className="mb-3">Đánh giá từ khách hàng</h4>
                      
                      {(!reviews || reviews.length === 0) && (
                        <p className="text-muted">Chưa có đánh giá nào cho tour này.</p>
                      )}
                      
                      {reviews && Array.isArray(reviews) && reviews.map((review, index) => {
                        if (!review) return null;
                        return (
                          <div key={index} className="review-item">
                            <div className="review-header">
                              <div className="user-info">
                                <img src={avatar} alt="avatar" className="user-avatar" />
                                <div>
                                  <h5 className="review-author">{review.username || "Người dùng"}</h5>
                                  <p className="review-date">Đăng ngày {new Date(review.createdAt).toLocaleDateString("vi-VN", options)}</p>
                                </div>
                              </div>
                              <div className="review-rating">
                                <span className="review-rating-text">{review.rating}.0</span>
                                <div className="d-flex">
                                  {Array(5).fill(null).map((_, i) => (
                                    <i 
                                      key={i} 
                                      className={i < review.rating ? "ri-star-fill star-icon" : "ri-star-fill empty"}
                                    ></i>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="review-content">
                              {review.reviewText}
                            </div>
                            
                            {index < reviews.length - 1 && <div className="divider"></div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </Col>

            <Col lg="4">
              <MultiStepBooking tour={tour} avgRating={avgRating} />
            </Col>
          </Row>
        </Container>
      </section>

      {/* Tour tương tự */}
      <section>
        <Container>
          <h2 className="similar-tour-title">Tour tương tự</h2>
          <Row>
            {similarTours && similarTours.length > 0 ? (
              similarTours.map((similarTour) => (
                <Col lg="4" md="6" sm="6" className="mb-4" key={similarTour._id}>
                  <div className="tour-card">
                    <div className="tour-img">
                      <img 
                        src={
                          similarTour.photo?.startsWith("http")
                            ? similarTour.photo
                            : "https://via.placeholder.com/300x200?text=No+Image"
                        } 
                        alt={similarTour.title}
                      />
                    </div>
                    <div className="card-body">
                      <h5 className="tour-title">
                        <a href={`/tour/${similarTour._id}`}>{similarTour.title}</a>
                      </h5>
                      <div className="tour-city">
                        <i className="ri-map-pin-line"></i> {similarTour.city}
                      </div>
                      <div className="card-footer d-flex align-items-center justify-content-between mt-3">
                        <h5>
                          {similarTour.price.toLocaleString()} <span>VNĐ</span>
                        </h5>
                        <a href={`/tour/${similarTour._id}`} className="btn booking-btn">
                          Xem chi tiết
                        </a>
                      </div>
                    </div>
                  </div>
                </Col>
              ))
            ) : (
              <Col>
                <div className="text-center py-5">
                  <p>Không có tour tương tự nào.</p>
                </div>
              </Col>
            )}
          </Row>
        </Container>
      </section>

      <Newsletter />
    </>
  );
};

export default TourDetails;
