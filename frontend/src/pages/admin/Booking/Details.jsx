import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Card, Badge, Button, Table, Modal, Form, Spinner, Row, Col } from "react-bootstrap";

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:4000/api/v1/booking/${id}`, {
        withCredentials: true,
      });

      if (res.data.success) {
        setBooking(res.data.data);
        setNewStatus(res.data.data.paymentStatus);
      }
    } catch (err) {
      console.error("❌ Error fetching booking details:", err);
      if (err.response?.status === 404) {
        alert("Không tìm thấy booking!");
        navigate("/admin/bookings");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      alert("Vui lòng chọn trạng thái!");
      return;
    }

    try {
      setUpdating(true);
      const res = await axios.put(
        `http://localhost:4000/api/v1/booking/${id}/status`,
        { status: newStatus },
        { withCredentials: true }
      );

      if (res.data.success) {
        alert("Cập nhật trạng thái thành công!");
        setBooking(res.data.data);
        setShowStatusModal(false);
      }
    } catch (err) {
      console.error("❌ Error updating status:", err);
      alert(err.response?.data?.message || "Lỗi khi cập nhật trạng thái!");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      alert("Vui lòng nhập lý do hủy!");
      return;
    }

    if (!window.confirm("Bạn có chắc chắn muốn hủy booking này?")) {
      return;
    }

    try {
      setUpdating(true);
      const res = await axios.post(
        `http://localhost:4000/api/v1/booking/${id}/cancel`,
        { reason: cancelReason },
        { withCredentials: true }
      );

      if (res.data.success) {
        alert("Hủy booking thành công!");
        setBooking(res.data.data);
        setShowCancelModal(false);
        setCancelReason("");
      }
    } catch (err) {
      console.error("❌ Error cancelling booking:", err);
      alert(err.response?.data?.message || "Lỗi khi hủy booking!");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      Pending: "warning",
      Confirmed: "success",
      Failed: "danger",
      Cancelled: "secondary",
    };
    return (
      <Badge bg={config[status] || "secondary"} className="px-3 py-2">
        {status}
      </Badge>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return amount?.toLocaleString("vi-VN") + "₫";
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem" }} />
        <p className="mt-3">Đang tải thông tin booking...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-5">
        <h3 className="text-muted">Không tìm thấy booking</h3>
        <Button variant="primary" onClick={() => navigate("/admin/bookings")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button variant="outline-secondary" size="sm" onClick={() => navigate("/admin/bookings")} className="me-3">
            <i className="ri-arrow-left-line me-1"></i> Quay lại
          </Button>
          <h3 className="d-inline fw-bold">
            <i className="ri-file-list-line me-2"></i>
            Chi tiết Booking
          </h3>
        </div>
        <div>
          <code className="fs-6">#{booking._id}</code>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-4 text-center">
        {getStatusBadge(booking.paymentStatus)}
      </div>

      <Row>
        {/* Left Column */}
        <Col lg={8}>
          {/* Customer Info */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <i className="ri-user-line me-2"></i>
                Thông tin khách hàng
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <label className="text-muted small">Họ tên:</label>
                    <p className="mb-0 fw-bold">{booking.fullName}</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <label className="text-muted small">Số điện thoại:</label>
                    <p className="mb-0 fw-bold">{booking.phone}</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <label className="text-muted small">Email:</label>
                    <p className="mb-0">{booking.userEmail}</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <label className="text-muted small">Số lượng khách:</label>
                    <p className="mb-0">
                      <Badge bg="info">{booking.guestSize} người</Badge>
                    </p>
                  </div>
                </Col>
                <Col md={12}>
                  <div className="mb-0">
                    <label className="text-muted small">Địa chỉ đầy đủ:</label>
                    <p className="mb-0">
                      {[
                        booking.addressDetail,
                        booking.ward?.name,
                        booking.district?.name,
                        booking.province?.name,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Tour Info */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <i className="ri-map-pin-line me-2"></i>
                Thông tin Tour
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <label className="text-muted small">Tên tour:</label>
                <h5 className="mb-0 text-primary">{booking.tourName}</h5>
              </div>
              <div className="mb-3">
                <label className="text-muted small">Mã tour:</label>
                <p className="mb-0">
                  <code>{booking.tourId}</code>
                </p>
              </div>
              <div className="mb-0">
                <label className="text-muted small">Ngày đặt:</label>
                <p className="mb-0">{formatDate(booking.bookAt)}</p>
              </div>
            </Card.Body>
          </Card>

          {/* Guest List */}
          {booking.guests && booking.guests.length > 0 && (
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0">
                  <i className="ri-group-line me-2"></i>
                  Danh sách khách ({booking.guests.length} người)
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table bordered hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th width="50">#</th>
                        <th>Họ tên</th>
                        <th width="80">Tuổi</th>
                        <th width="120">Loại khách</th>
                        <th width="150" className="text-end">Giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {booking.guests.map((guest, index) => (
                        <tr key={index}>
                          <td className="text-center">{index + 1}</td>
                          <td>{guest.fullName}</td>
                          <td className="text-center">{guest.age}</td>
                          <td>
                            <Badge bg="secondary">{guest.guestType}</Badge>
                          </td>
                          <td className="text-end fw-bold">{formatCurrency(guest.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Timeline */}
          <Card className="shadow-sm mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="ri-time-line me-2"></i>
                Lịch sử
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="timeline">
                <div className="timeline-item mb-3">
                  <i className="ri-checkbox-circle-fill text-primary me-2"></i>
                  <strong>Booking được tạo:</strong> {formatDate(booking.createdAt)}
                </div>
                {booking.updatedAt && booking.updatedAt !== booking.createdAt && (
                  <div className="timeline-item mb-3">
                    <i className="ri-refresh-line text-info me-2"></i>
                    <strong>Cập nhật lần cuối:</strong> {formatDate(booking.updatedAt)}
                  </div>
                )}
                {booking.cancelledAt && (
                  <div className="timeline-item mb-3">
                    <i className="ri-close-circle-fill text-danger me-2"></i>
                    <strong>Booking bị hủy:</strong> {formatDate(booking.cancelledAt)}
                    <br />
                    <span className="text-muted small">
                      Lý do: {booking.cancellationReason || "Không có"}
                    </span>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column - Payment Info */}
        <Col lg={4}>
          <Card className="shadow-sm mb-4 sticky-top" style={{ top: "20px" }}>
            <Card.Header className="bg-warning">
              <h5 className="mb-0">
                <i className="ri-money-dollar-circle-line me-2"></i>
                Thanh toán
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="payment-summary">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Giá cơ bản:</span>
                  <span>{formatCurrency(booking.basePrice)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Số khách:</span>
                  <span>{booking.guestSize}</span>
                </div>

                {booking.appliedDiscounts && booking.appliedDiscounts.length > 0 && (
                  <>
                    <hr className="my-2" />
                    {booking.appliedDiscounts.map((discount, idx) => (
                      <div key={idx} className="d-flex justify-content-between mb-1 text-success">
                        <small>{discount.name}:</small>
                        <small>- {formatCurrency(discount.amount)}</small>
                      </div>
                    ))}
                  </>
                )}

                {booking.appliedSurcharges && booking.appliedSurcharges.length > 0 && (
                  <>
                    <hr className="my-2" />
                    {booking.appliedSurcharges.map((surcharge, idx) => (
                      <div key={idx} className="d-flex justify-content-between mb-1 text-danger">
                        <small>{surcharge.name}:</small>
                        <small>+ {formatCurrency(surcharge.amount)}</small>
                      </div>
                    ))}
                  </>
                )}

                <hr />

                <div className="d-flex justify-content-between mb-3">
                  <strong>Tổng cộng:</strong>
                  <h4 className="text-success mb-0">{formatCurrency(booking.totalAmount)}</h4>
                </div>

                <div className="p-3 bg-light rounded mb-3">
                  <div className="mb-2">
                    <label className="text-muted small">Phương thức:</label>
                    <div>
                      <Badge bg={booking.paymentMethod === "MoMo" ? "primary" : "secondary"}>
                        {booking.paymentMethod}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-muted small">Trạng thái:</label>
                    <div>{getStatusBadge(booking.paymentStatus)}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    onClick={() => setShowStatusModal(true)}
                    disabled={booking.paymentStatus === "Cancelled"}
                  >
                    <i className="ri-edit-line me-1"></i> Cập nhật trạng thái
                  </Button>

                  {["Pending", "Confirmed"].includes(booking.paymentStatus) && (
                    <Button
                      variant="danger"
                      onClick={() => setShowCancelModal(true)}
                    >
                      <i className="ri-close-circle-line me-1"></i> Hủy booking
                    </Button>
                  )}

                  {booking.paymentStatus === "Confirmed" && (
                    <Button variant="success" outline>
                      <i className="ri-printer-line me-1"></i> In hóa đơn
                    </Button>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Update Status Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cập nhật trạng thái Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Chọn trạng thái mới:</Form.Label>
            <Form.Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Failed">Failed</option>
              <option value="Cancelled">Cancelled</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)} disabled={updating}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleUpdateStatus} disabled={updating}>
            {updating ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Đang cập nhật...
              </>
            ) : (
              "Cập nhật"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Cancel Booking Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Hủy Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Lý do hủy:</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy booking..."
            />
          </Form.Group>
          <div className="alert alert-warning mt-3 mb-0">
            <i className="ri-alert-line me-2"></i>
            <strong>Chú ý:</strong> Hành động này sẽ hoàn trả số chỗ cho tour và không thể hoàn tác!
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)} disabled={updating}>
            Đóng
          </Button>
          <Button variant="danger" onClick={handleCancelBooking} disabled={updating}>
            {updating ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Đang hủy...
              </>
            ) : (
              "Xác nhận hủy"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BookingDetails;
