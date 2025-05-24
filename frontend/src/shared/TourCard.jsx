import React, { useContext, useState, useEffect } from 'react';
import { Card, CardBody } from 'reactstrap';
import { Link } from 'react-router-dom';
import caculateAvgRating from '../utils/avgRating';
import './tour-card.css';
import { AuthContext } from '../context/AuthContext';

const TourCard = ({ tour }) => {
  const { _id, title, city, photo, price, featured, reviews } = tour;
  const { totalRating, avgRating } = caculateAvgRating(reviews);
  const { user } = useContext(AuthContext);
  const [isFavorite, setIsFavorite] = useState(false);
  const [hovered, setHovered] = useState(false); // 👉 Trạng thái hover

  const imageURL = photo?.startsWith("http") ? photo : "https://via.placeholder.com/400x300?text=No+Image";
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user) return;
      const res = await fetch(`http://localhost:4000/api/v1/users/${user._id}/favorites`);
      const data = await res.json();
      const isFav = data.favorites.some(fav => fav._id === _id);
      setIsFavorite(isFav);
    };
    checkFavorite();
  }, [user, _id]);

  const toggleFavorite = async () => {
    if (!user) return alert("Vui lòng đăng nhập để lưu tour yêu thích.");

    try {
      const url = `http://localhost:4000/api/v1/users/${user._id}/favorites`;
      const method = isFavorite ? "DELETE" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tourId: _id }),
      });

      const result = await res.json();
      if (res.ok) {
        setIsFavorite(!isFavorite);
      } else {
        console.error("Lỗi khi cập nhật yêu thích:", result.message);
      }
    } catch (err) {
      console.error("Lỗi kết nối server:", err);
    }
  };

  return (
    <div className="tour__card">
      <Card>
        <div className="tour__img">
          <img src={imageURL} alt={title} className="img-fluid" />
          {featured && <span>Featured</span>}
        </div>

        <CardBody>
          <div className="card__top d-flex align-items-center justify-content-between">
            <span className="tour__location d-flex align-items-center gap-1">
              <i className="ri-map-pin-line"></i> {city}
            </span>
            <span className="tour__rating d-flex align-items-center gap-1">
              <i className="ri-star-line"></i>{' '}
              {avgRating === 0 ? null : avgRating}
              {totalRating === 0
                ? 'Chưa có đánh giá nào'
                : <span>({reviews.length})</span>}
            </span>
          </div>

          <h5 className="tour__title">
            <Link to={`/tour/${_id}`}>{title}</Link>
          </h5>

          <div className="card__bottom d-flex align-items-center justify-content-between mt-3">
            <h5>
              ${price} <span>/mỗi người</span>
            </h5>

            <div className="d-flex gap-2">
              <button className="btn booking__btn">
                <Link to={`/tour/${_id}`}>Đặt Ngay</Link>
              </button>

              {/* Nút yêu thích có tooltip */}
              <div
                className="position-relative"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
              >
                <button
                  className="btn favorite__btn"
                  onClick={toggleFavorite}
                  title="Yêu thích"
                >
                  <i
                    className={isFavorite ? "ri-heart-fill" : "ri-heart-line"}
                    style={{ color: isFavorite ? "red" : "gray", fontSize: "2rem" }}
                  ></i>
                </button>

                {hovered && (
                  <div className="favorite__tooltip">
                    Yêu thích
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default TourCard;
