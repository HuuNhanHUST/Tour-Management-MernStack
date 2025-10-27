import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "reactstrap";
import { Link, useSearchParams } from "react-router-dom";
import "../styles/thank-you.css";

const ThankYou = () => {
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState({
    success: null,
    message: "",
    orderId: "",
    loading: true
  });

  useEffect(() => {
    // Parse query parameters
    const success = searchParams.get("success");
    const message = searchParams.get("message");
    const orderId = searchParams.get("orderId");
    const resultCode = searchParams.get("resultCode");

    // Determine payment status
    if (success === "true") {
      setPaymentStatus({
        success: true,
        message: "Thanh toán thành công!",
        orderId: orderId || "",
        loading: false
      });
    } else if (success === "false") {
      // Parse error message
      let errorMessage = "Thanh toán thất bại!";
      
      if (message === "invalid_signature") {
        errorMessage = "Chữ ký không hợp lệ. Vui lòng liên hệ hỗ trợ.";
      } else if (message === "server_error") {
        errorMessage = "Lỗi server. Vui lòng thử lại sau.";
      } else if (resultCode === "1006") {
        errorMessage = "Bạn đã hủy thanh toán.";
      } else if (message) {
        errorMessage = decodeURIComponent(message);
      }

      setPaymentStatus({
        success: false,
        message: errorMessage,
        orderId: orderId || "",
        loading: false
      });
    } else {
      // Cash payment (no query params) - default success
      setPaymentStatus({
        success: true,
        message: "Đặt tour thành công!",
        orderId: "",
        loading: false
      });
    }
  }, [searchParams]);

  if (paymentStatus.loading) {
    return (
      <section>
        <Container>
          <Row>
            <Col lg="12" className="pt-5 text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Đang xử lý...</p>
            </Col>
          </Row>
        </Container>
      </section>
    );
  }

  return (
    <section>
      <Container>
        <Row>
          <Col lg="12" className="pt-5 text-center">
            <div className="thank__you">
              {paymentStatus.success ? (
                <>
                  <span className="success-icon">
                    <i className="ri-checkbox-circle-line"></i>
                  </span>
                  <h1 className="mb-3 fw-semibold">Cảm Ơn!</h1>
                  <h3 className="mb-4">{paymentStatus.message}</h3>
                  <p className="text-muted mb-4">
                    Tour của bạn đã được đặt thành công.
                    {paymentStatus.orderId && (
                      <><br />Mã đơn hàng: <strong>{paymentStatus.orderId}</strong></>
                    )}
                  </p>
                </>
              ) : (
                <>
                  <span className="error-icon">
                    <i className="ri-close-circle-line"></i>
                  </span>
                  <h1 className="mb-3 fw-semibold text-danger">Oops!</h1>
                  <h3 className="mb-4">{paymentStatus.message}</h3>
                  <p className="text-muted mb-4">
                    {paymentStatus.orderId && (
                      <>Mã đơn hàng: <strong>{paymentStatus.orderId}</strong><br /></>
                    )}
                    Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn.
                  </p>
                </>
              )}

              <div className="d-flex gap-3 justify-content-center">
                <button className="btn primary__btn">
                  <Link to="/home">Về Trang Chủ</Link>
                </button>
                {paymentStatus.success && (
                  <button className="btn btn-outline-primary">
                    <Link to="/payment-history">Xem Lịch Sử</Link>
                  </button>
                )}
                {!paymentStatus.success && (
                  <button className="btn btn-outline-primary">
                    <Link to="/tour">Xem Tour Khác</Link>
                  </button>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default ThankYou;
