import React, { useEffect, useRef, useState, useContext } from "react";
import "../styles/tour-details.css";
import { Container, Row, Col, Form, ListGroup } from "reactstrap";
import { useParams } from "react-router-dom";
import caculateAvgRating from "../utils/avgRating";
import avatar from "../assets/images/avatar.jpg";
import Booking from "../components/Booking/Booking";
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

  const { data: tour, loading, error } = useFetch(`${BASE_URL}/tour/${id}`);
  const { totalRating, avgRating } = caculateAvgRating(tour?.reviews || []);
  const options = { day: "numeric", month: "long", year: "numeric" };

  useEffect(() => {
    if (tour && user) {
      const existing = tour.reviews?.find((r) => r.username === user.username);
      if (existing) {
        setUserReview(existing);
        reviewMsgRef.current.value = existing.reviewText;
        setTourRating(existing.rating);
      }
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
      window.location.reload();
    } catch (err) {
      alert("Đã có lỗi xảy ra khi gửi đánh giá.");
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (loading) return <h4 className="text-center pt-5">Đang tải dữ liệu...</h4>;
  if (error || !tour) return <h4 className="text-center pt-5">Không tìm thấy tour</h4>;

  const {
    photo,
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
    itinerary
  } = tour;

  const availableSlots = maxGroupSize - currentBookings;
  const isTourExpired = new Date() > new Date(endDate);

  const imageURL =
    photo?.startsWith("http")
      ? photo
      : "https://via.placeholder.com/800x400?text=No+Image";

  return (
    <>
      <section>
        <Container>
          <Row>
            <Col lg="8">
              <div className="tour__content">
                <img
                  src={imageURL}
                  alt={title}
                  className="img-fluid mb-4"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/800x400?text=Image+Not+Found";
                  }}
                />

                <div className="tour__info">
                  <h2>{title}</h2>

                  <div className="d-flex align-items-center gap-5">
                    <span className="tour__rating d-flex align-items-center gap-1">
                      <i className="ri-star-line" style={{ color: "var(--secondary-color)" }}></i>
                      {avgRating === 0 ? "Chưa có đánh giá" : <span>{avgRating}</span>}
                      {totalRating !== 0 && <span>({reviews?.length})</span>}
                    </span>
                    <span>
                      <i className="ri-map-pin-user-fill"></i> {address}
                    </span>
                  </div>

                  <div className="tour__extra-details">
                    <span>
                      <i className="ri-map-pin-2-line"></i> <strong>Thành phố:</strong> {city}
                    </span>
                    <span>
                      <i className="ri-money-dollar-circle-line"></i> <strong>Giá:</strong> ${price}/người
                    </span>
                    <span>
                      <i className="ri-map-pin-time-line"></i> <strong>Khoảng cách:</strong> {distance} km
                    </span>
                    <span>
                      <i className="ri-group-line"></i> <strong>Sức chứa:</strong> {maxGroupSize} người
                    </span>
                    <span>
                      <i className="ri-group-line"></i> <strong>Đã đặt:</strong> {currentBookings} người
                    </span>

                    {minGroupSize && currentBookings < minGroupSize && (
                      <p className="text-warning fw-bold mt-2">
                        ⚠️ Tour yêu cầu tối thiểu {minGroupSize} người.<br />
                        Hiện tại mới có {currentBookings} người – tour có thể bị hủy nếu không đủ!
                      </p>
                    )}

                    <span>
                      <i className="ri-group-line"></i> <strong>Còn lại:</strong> {availableSlots > 0 ? `${availableSlots} người` : "❌ Hết chỗ"}
                    </span>
                    <span>
                      <i className="ri-calendar-todo-line"></i> <strong>Ngày đi:</strong>{" "}
                      {startDate ? new Date(startDate).toLocaleDateString("vi-VN") : "-"}
                    </span>
                    <span>
                      <i className="ri-calendar-check-line"></i> <strong>Ngày về:</strong>{" "}
                      {endDate ? new Date(endDate).toLocaleDateString("vi-VN") : "-"}
                    </span>
                  </div>

                  {isTourExpired && (
                    <p className="text-danger fw-bold mt-3">
                      ❌ Tour này đã kết thúc. Bạn không thể đặt nữa.
                    </p>
                  )}

                  <h5 className="mt-4">Mô tả</h5>
                  <p>{desc}</p>

                  <h5 className="mt-4">Phương tiện di chuyển</h5>
                  <p>{transportation || "Không có thông tin"}</p>

                  <h5 className="mt-4">Thông tin khách sạn</h5>
                  <p>{hotelInfo || "Không có thông tin"}</p>

                  <h5 className="mt-4">Bữa ăn bao gồm</h5>
                  <ul>
                    {mealsIncluded?.length > 0 ? mealsIncluded.map((meal, i) => <li key={i}>{meal}</li>) : <li>Không có thông tin</li>}
                  </ul>

                  <h5 className="mt-4">Các hoạt động trong tour</h5>
                  <ul>
                    {activities?.length > 0 ? activities.map((act, i) => <li key={i}>{act}</li>) : <li>Không có thông tin</li>}
                  </ul>

                  <h5 className="mt-4">🗓️ Lịch trình tour</h5>
                  {itinerary?.length > 0 ? (
                    itinerary.map((item, i) => (
                      <div key={i} className="mb-3">
                        <h6>Ngày {item.day}: {item.title}</h6>
                        <p>{item.description}</p>
                      </div>
                    ))
                  ) : (
                    <p>Không có lịch trình chi tiết.</p>
                  )}
                </div>

                <div className="tour__reviews mt-4">
                  <h4>Đánh giá ({reviews?.length})</h4>

                  <Form onSubmit={submitHandler}>
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
                      <input
                        type="text"
                        ref={reviewMsgRef}
                        placeholder="Chia sẻ cảm nhận của bạn..."
                        required
                      />
                      <button className="btn primary__btn text-white" type="submit">
                        {userReview ? "Cập nhật đánh giá" : "Gửi đánh giá"}
                      </button>
                    </div>
                  </Form>

                  <ListGroup className="user__reviews">
                    {reviews?.map((review, index) => (
                      <div key={index} className="review__item">
                        <img src={avatar} alt="avatar" />
                        <div className="w-100">
                          <div className="d-flex align-items-center justify-content-between">
                            <div>
                              <h5>{review.username || "Người dùng"}</h5>
                              <p>{new Date(review.createdAt).toLocaleDateString("vi-VN", options)}</p>
                            </div>
                            <span className="review__rating">
                              {review.rating} <i className="ri-star-s-fill"></i>
                            </span>
                          </div>
                          <h6>{review.reviewText}</h6>
                        </div>
                      </div>
                    ))}
                  </ListGroup>
                </div>
              </div>
            </Col>

            <Col lg="4">
              <Booking tour={tour} avgRating={avgRating} />
            </Col>
          </Row>
        </Container>
      </section>

      <Newsletter />
    </>
  );
};

export default TourDetails;
