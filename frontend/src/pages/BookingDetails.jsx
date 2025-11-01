import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Row, Col, Card, Badge, Button, Spinner, Table } from "reactstrap";
import "../styles/booking-details.css";

const BookingDetails = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchBookingDetails = async () => {
      try {
        const res = await axios.get(
          `http://localhost:4000/api/v1/booking/${id}`,
          { withCredentials: true }
        );
        
        if (res.data.success) {
          setBooking(res.data.data);
        }
      } catch (err) {
        console.error("❌ Error fetching booking details:", err);
        if (err.response?.status === 401) {
          navigate("/login");
        } else if (err.response?.status === 404) {
          alert("Không tìm thấy booking này!");
          navigate("/my-bookings");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [id, user, navigate]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      Pending: { color: "warning", icon: "⏳" },
      Confirmed: { color: "success", icon: "✅" },
      Failed: { color: "danger", icon: "❌" },
      Cancelled: { color: "secondary", icon: "🚫" }
    };
    
    const config = statusConfig[status] || { color: "secondary", icon: "❓" };
    
    return (
      <Badge color={config.color} pill className="px-3 py-2">
        {config.icon} {status}
      </Badge>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner color="primary" style={{ width: "3rem", height: "3rem" }} />
        <p className="mt-3">Đang tải thông tin booking...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <Container className="py-5 text-center">
        <h3 className="text-muted">Không tìm thấy booking</h3>
        <Button color="primary" onClick={() => navigate("/my-bookings")} className="mt-3">
          Quay lại danh sách
        </Button>
      </Container>
    );
  }

  return (
    <section className="booking-details-section">
      <Container>
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center flex-wrap">
              <div>
                <h2 className="mb-2">
                  <i className="ri-file-list-line"></i> Chi tiết booking
                </h2>
                <p className="text-muted mb-0">
                  Mã booking: <strong className="text-primary">
                    {booking.confirmationNumber || `#${booking._id.slice(-8).toUpperCase()}`}
                  </strong>
                </p>
              </div>
              <div className="mt-3 mt-md-0">
                {getStatusBadge(booking.paymentStatus)}
              </div>
            </div>
          </Col>
        </Row>

        {/* Tour Information */}
        <Row className="mb-4">
          <Col lg={8}>
            <Card className="shadow-sm mb-4">
              <div className="card-body">
                <h4 className="card-title mb-4">
                  <i className="ri-map-2-line text-primary"></i> Thông tin Tour
                </h4>
                <div className="info-group">
                  <h5 className="text-primary">{booking.tourName}</h5>
                  {booking.tourId && (
                    <>
                      {booking.tourId.city && (
                        <p className="mb-2">
                          <i className="ri-map-pin-line"></i> 
                          <strong> Điểm đến:</strong> {booking.tourId.city}
                        </p>
                      )}
                      {booking.tourId.featured && (
                        <Badge color="info">
                          <i className="ri-star-fill"></i> Featured Tour
                        </Badge>
                      )}
                      <div className="mt-3">
                        <Button 
                          color="outline-primary" 
                          size="sm"
                          onClick={() => navigate(`/tour/${booking.tourId._id}`)}
                        >
                          <i className="ri-eye-line"></i> Xem chi tiết tour
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Customer Information */}
            <Card className="shadow-sm mb-4">
              <div className="card-body">
                <h4 className="card-title mb-4">
                  <i className="ri-user-line text-primary"></i> Thông tin khách hàng
                </h4>
                <Row>
                  <Col md={6}>
                    <div className="info-item mb-3">
                      <label className="text-muted">Họ tên:</label>
                      <p className="mb-0 fw-bold">{booking.fullName}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="info-item mb-3">
                      <label className="text-muted">Số điện thoại:</label>
                      <p className="mb-0 fw-bold">{booking.phone}</p>
                    </div>
                  </Col>
                  <Col md={12}>
                    <div className="info-item mb-3">
                      <label className="text-muted">Địa chỉ đầy đủ:</label>
                      <p className="mb-0">
                        {[
                          booking.addressDetail,
                          booking.ward,
                          booking.district,
                          booking.province
                        ].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="info-item mb-3">
                      <label className="text-muted">Số lượng khách:</label>
                      <p className="mb-0 fw-bold">{booking.guestSize} người</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="info-item mb-3">
                      <label className="text-muted">Ngày đặt tour:</label>
                      <p className="mb-0">{formatDate(booking.bookAt)}</p>
                    </div>
                  </Col>
                </Row>
              </div>
            </Card>

            {/* Guest List */}
            {booking.guests && booking.guests.length > 0 && (
              <Card className="shadow-sm mb-4">
                <div className="card-body">
                  <h4 className="card-title mb-4">
                    <i className="ri-group-line text-primary"></i> Danh sách khách
                  </h4>
                  <div className="table-responsive">
                    <Table bordered hover>
                      <thead className="table-light">
                        <tr>
                          <th width="60">#</th>
                          <th>Họ tên</th>
                          <th width="100">Tuổi</th>
                          <th width="150">Loại khách</th>
                          <th width="150" className="text-end">Giá</th>
                        </tr>
                      </thead>
                      <tbody>
                        {booking.guests.map((guest, index) => (
                          <tr key={index}>
                            <td className="text-center">{index + 1}</td>
                            <td>{guest.name}</td>
                            <td className="text-center">{guest.age}</td>
                            <td>
                              <Badge color="secondary" pill>
                                {guest.type}
                              </Badge>
                            </td>
                            <td className="text-end fw-bold">
                              {guest.price?.toLocaleString() || 0}₫
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              </Card>
            )}
          </Col>

          {/* Payment Information Sidebar */}
          <Col lg={4}>
            <Card className="shadow-sm sticky-top" style={{ top: "20px" }}>
              <div className="card-body">
                <h4 className="card-title mb-4">
                  <i className="ri-money-dollar-circle-line text-success"></i> Thanh toán
                </h4>
                
                <div className="payment-summary">
                  {booking.tourId?.price && (
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Giá cơ bản:</span>
                      <span>{booking.tourId.price.toLocaleString()}₫</span>
                    </div>
                  )}
                  
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Số khách:</span>
                    <span>{booking.guestSize}</span>
                  </div>

                  <hr />

                  <div className="d-flex justify-content-between mb-3">
                    <span className="fw-bold">Tổng cộng:</span>
                    <span className="h5 text-success mb-0 fw-bold">
                      {booking.totalAmount.toLocaleString()}₫
                    </span>
                  </div>

                  <div className="payment-method-section p-3 bg-light rounded mb-3">
                    <div className="mb-2">
                      <label className="text-muted small">Phương thức thanh toán:</label>
                      <p className="mb-0 fw-bold">{booking.paymentMethod}</p>
                    </div>
                    <div>
                      <label className="text-muted small">Trạng thái:</label>
                      <div className="mt-1">
                        {getStatusBadge(booking.paymentStatus)}
                      </div>
                    </div>
                  </div>

                  {booking.userId && (
                    <div className="text-muted small">
                      <i className="ri-user-line"></i> User ID: {booking.userId}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4">
                  {booking.paymentStatus === "Confirmed" && (
                    <>
                      <Button color="success" block className="mb-2" onClick={handlePrint}>
                        <i className="ri-printer-line"></i> In hóa đơn
                      </Button>
                      <Button 
                        color="info" 
                        outline 
                        block 
                        className="mb-2"
                        onClick={() => navigate(`/tour/${booking.tourId?._id}/review`)}
                      >
                        <i className="ri-star-line"></i> Đánh giá tour
                      </Button>
                    </>
                  )}
                  
                  {booking.paymentStatus === "Pending" && (
                    <Button color="danger" outline block className="mb-2">
                      <i className="ri-close-circle-line"></i> Hủy đơn
                    </Button>
                  )}
                  
                  <Button 
                    color="secondary" 
                    outline 
                    block 
                    onClick={() => navigate("/my-bookings")}
                  >
                    <i className="ri-arrow-left-line"></i> Quay lại
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Timeline */}
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-3">
                  <i className="ri-time-line text-primary"></i> Lịch sử
                </h5>
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-marker bg-primary"></div>
                    <div className="timeline-content">
                      <small className="text-muted">{formatDate(booking.createdAt)}</small>
                      <p className="mb-0">Booking được tạo</p>
                    </div>
                  </div>
                  {booking.updatedAt && booking.updatedAt !== booking.createdAt && (
                    <div className="timeline-item">
                      <div className="timeline-marker bg-info"></div>
                      <div className="timeline-content">
                        <small className="text-muted">{formatDate(booking.updatedAt)}</small>
                        <p className="mb-0">Cập nhật lần cuối</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default BookingDetails;
