import React, { useEffect, useRef, useState, useContext } from "react";
import '../styles/tour-details.css';
import { Container, Row, Col, Form, ListGroup } from 'reactstrap';
import { useParams } from 'react-router-dom';
import caculateAvgRating from "../utils/avgRating";
import avatar from '../assets/images/avatar.jpg';
import Booking from "../components/Booking/Booking";
import Newsletter from "../shared/Newsleter";
import useFetch from "../hooks/useFetch";
import { BASE_URL } from "../utils/config";
import { AuthContext } from "../context/AuthContext";

const TourDetails = () => {
  const { id } = useParams();
  const reviewMsgRef = useRef('');
  const [tourRating, setTourRating] = useState(null);
  const [userReview, setUserReview] = useState(null);
  const { user } = useContext(AuthContext);

  const { data: tour, loading, error } = useFetch(`${BASE_URL}/tour/${id}`);
  const { totalRating, avgRating } = caculateAvgRating(tour?.reviews || []);
  const options = { day: 'numeric', month: 'long', year: 'numeric' };

  // Khi load tour xong → check user đã review chưa
  useEffect(() => {
    if (tour && user) {
      const existing = tour.reviews?.find(r => r.username === user.username);
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

    if (!user) {
      alert('Vui lòng đăng nhập để đánh giá!');
      return;
    }

    if (!tourRating) {
      alert('Vui lòng chọn số sao!');
      return;
    }

    const reviewObj = {
      reviewText,
      rating: tourRating
    };

    try {
      const res = await fetch(`${BASE_URL}/review/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(reviewObj)
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("❌ Server response:", result);
        alert(result.message || "Gửi đánh giá thất bại!");
        return;
      }

      alert(userReview ? "✅ Cập nhật đánh giá thành công!" : "✅ Gửi đánh giá thành công!");
      window.location.reload();

    } catch (err) {
      console.error("❌ Fetch error:", err);
      alert("Đã có lỗi xảy ra khi gửi đánh giá.");
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (loading) return <h4 className="text-center pt-5">Đang tải dữ liệu...</h4>;
  if (error || !tour) return <h4 className="text-center pt-5">Không tìm thấy tour</h4>;

  const { photo, title, desc, price, address, reviews, city, distance, maxGroupSize } = tour;

  // ✅ Xử lý ảnh (cả local public, uploads, link online)
  const imageURL =
    photo?.startsWith("http") ||
    photo?.startsWith("data:") ||
    photo?.startsWith("/tour-images")
      ? photo
      : `http://localhost:4000/uploads/${photo}`;

  return (
    <>
      <section>
        <Container>
          <Row>
            <Col lg="8">
              <div className="tour__content">
                <img src={imageURL} alt={title} className="img-fluid mb-4" />

                <div className="tour__info">
                  <h2>{title}</h2>

                  <div className="d-flex align-items-center gap-5">
                    <span className="tour__rating d-flex align-items-center gap-1">
                      <i className="ri-star-line" style={{ color: "var(--secondary-color)" }}></i>
                      {avgRating === 0 ? 'Chưa có đánh giá' : <span>{avgRating}</span>}
                      {totalRating !== 0 && <span>({reviews?.length})</span>}
                    </span>
                    <span><i className="ri-map-pin-user-fill"></i>{address}</span>
                  </div>

                  <div className="tour__extra-details">
                    <span><i className="ri-map-pin-2-line"></i>{city}</span>
                    <span><i className="ri-money-dollar-circle-line"></i>${price}/người</span>
                    <span><i className="ri-map-pin-time-line"></i>{distance} km</span>
                    <span><i className="ri-group-line"></i>{maxGroupSize} người</span>
                  </div>

                  <h5>Mô tả</h5>
                  <p>{desc}</p>
                </div>

                <div className="tour__reviews mt-4">
                  <h4>Đánh giá ({reviews?.length})</h4>

                  <Form onSubmit={submitHandler}>
                    <div className="d-flex align-items-center gap-3 mb-4 rating__group">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span
                          key={star}
                          onClick={() => setTourRating(star)}
                          className={tourRating === star ? 'selected' : ''}
                          style={{ cursor: 'pointer' }}
                        >
                          {star}<i className="ri-star-s-fill"></i>
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
                              <h5>{review.username || 'Người dùng'}</h5>
                              <p>{new Date(review.createdAt).toLocaleDateString('vi-VN', options)}</p>
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
