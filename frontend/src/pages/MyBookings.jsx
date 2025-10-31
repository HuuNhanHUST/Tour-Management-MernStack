import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Badge, Button, Spinner } from "reactstrap";
import "../styles/my-bookings.css";

const MyBookings = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchBookings = async () => {
      try {
        const res = await axios.get(
          "http://localhost:4000/api/v1/booking/user/my-bookings",
          { withCredentials: true }
        );
        
        if (res.data.success) {
          setBookings(res.data.data);
        }
      } catch (err) {
        console.error("❌ Error fetching bookings:", err);
        if (err.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, navigate]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      Pending: { color: "warning", icon: "⏳" },
      Confirmed: { color: "success", icon: "✅" },
      Failed: { color: "danger", icon: "❌" },
      Cancelled: { color: "secondary", icon: "🚫" }
    };
    
    const config = statusConfig[status] || { color: "secondary", icon: "❓" };
    
    return (
      <Badge color={config.color} className="px-3 py-2">
        {config.icon} {status}
      </Badge>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const handleViewDetails = (bookingId) => {
    navigate(`/booking/${bookingId}`);
  };

  const handleViewTour = (tourId) => {
    navigate(`/tour/${tourId}`);
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === "All") return true;
    return booking.paymentStatus === filter;
  });

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner color="primary" style={{ width: "3rem", height: "3rem" }} />
        <p className="mt-3">Đang tải danh sách tour...</p>
      </div>
    );
  }

  return (
    <section className="my-bookings-section">
      <Container>
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center flex-wrap">
              <h2 className="mb-3 mb-md-0">
                <i className="ri-file-list-3-line"></i> Danh sách tour đã đặt
              </h2>
              <div className="filter-buttons d-flex gap-2">
                {["All", "Pending", "Confirmed", "Cancelled"].map((status) => (
                  <Button
                    key={status}
                    color={filter === status ? "primary" : "outline-primary"}
                    size="sm"
                    onClick={() => setFilter(status)}
                  >
                    {status === "All" ? "Tất cả" : status}
                  </Button>
                ))}
              </div>
            </div>
          </Col>
        </Row>

        {filteredBookings.length === 0 ? (
          <div className="text-center py-5 empty-state">
            <div className="empty-icon mb-3">
              <i className="ri-folder-open-line" style={{ fontSize: "4rem", color: "#ccc" }}></i>
            </div>
            <h4 className="text-muted">
              {filter === "All" 
                ? "Bạn chưa đặt tour nào" 
                : `Không có tour nào với trạng thái "${filter}"`}
            </h4>
            <p className="text-muted mb-4">
              Khám phá các tour du lịch tuyệt vời của chúng tôi
            </p>
            <Button color="primary" onClick={() => navigate("/tour")}>
              <i className="ri-search-line"></i> Khám phá tours
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-3 text-muted">
              <i className="ri-information-line"></i> Tìm thấy {filteredBookings.length} booking
            </div>
            <Row>
              {filteredBookings.map((booking) => (
                <Col key={booking._id} lg={6} xl={4} className="mb-4">
                  <Card className="booking-card shadow-sm h-100">
                    <div className="card-body">
                      {/* Tour Title */}
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="card-title text-primary mb-0 flex-grow-1">
                          {booking.tourName}
                        </h5>
                        {booking.tourId?.featured && (
                          <Badge color="info" className="ms-2">
                            <i className="ri-star-fill"></i> Featured
                          </Badge>
                        )}
                      </div>
                      
                      {/* Status */}
                      <div className="mb-3">
                        {getStatusBadge(booking.paymentStatus)}
                      </div>

                      {/* Booking Details */}
                      <div className="booking-details mb-3">
                        <div className="detail-row">
                          <i className="ri-user-line"></i>
                          <span><strong>Khách hàng:</strong> {booking.fullName}</span>
                        </div>
                        <div className="detail-row">
                          <i className="ri-group-line"></i>
                          <span><strong>Số khách:</strong> {booking.guestSize} người</span>
                        </div>
                        <div className="detail-row">
                          <i className="ri-calendar-line"></i>
                          <span><strong>Ngày đặt:</strong> {formatDate(booking.bookAt)}</span>
                        </div>
                        <div className="detail-row">
                          <i className="ri-phone-line"></i>
                          <span><strong>SĐT:</strong> {booking.phone}</span>
                        </div>
                        {booking.tourId?.city && (
                          <div className="detail-row">
                            <i className="ri-map-pin-line"></i>
                            <span><strong>Điểm đến:</strong> {booking.tourId.city}</span>
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div className="price-section mb-3 p-3 bg-light rounded">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted">Tổng tiền:</span>
                          <span className="h5 text-success mb-0 fw-bold">
                            {booking.totalAmount.toLocaleString()}₫
                          </span>
                        </div>
                        <small className="text-muted">
                          Phương thức: {booking.paymentMethod}
                        </small>
                      </div>

                      {/* Actions */}
                      <div className="d-flex gap-2 flex-wrap">
                        <Button
                          color="primary"
                          size="sm"
                          onClick={() => handleViewDetails(booking._id)}
                          className="flex-grow-1"
                        >
                          <i className="ri-file-text-line"></i> Chi tiết
                        </Button>
                        
                        {booking.tourId?._id && (
                          <Button
                            color="outline-primary"
                            size="sm"
                            onClick={() => handleViewTour(booking.tourId._id)}
                          >
                            <i className="ri-eye-line"></i> Xem tour
                          </Button>
                        )}
                        
                        {booking.paymentStatus === "Confirmed" && (
                          <Button
                            color="info"
                            size="sm"
                            outline
                            onClick={() => navigate(`/tour/${booking.tourId._id}/review`)}
                          >
                            <i className="ri-star-line"></i> Đánh giá
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}

        {/* Back Button */}
        <Row className="mt-4">
          <Col className="text-center">
            <Button color="secondary" outline onClick={() => navigate("/")}>
              <i className="ri-arrow-left-line"></i> Quay về trang chủ
            </Button>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default MyBookings;
