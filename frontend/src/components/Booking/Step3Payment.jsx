import React, { useState } from "react";
import { Button, ListGroup, ListGroupItem } from "reactstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../utils/config.js";
import NotificationManager from "../shared/NotificationManager";

const Step3Payment = ({ tour, bookingData, updateBookingData, prevStep }) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("Cash");
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const { pricingData, guests, singleRoomCount, fullName, phone, province, district, ward, addressDetail, userId, userEmail } = bookingData;

  // Merge pricing data into guests
  const guestsWithPrices = guests.map((guest, index) => {
    const guestPrice = pricingData?.guestPrices?.[index];
    return {
      fullName: guest.fullName,
      age: guest.age,
      guestType: guest.guestType,
      price: guestPrice?.finalPrice || guestPrice?.basePrice || 0,
      discounts: guestPrice?.discounts || [],
      surcharges: guestPrice?.surcharges || []
    };
  });

  const totalAmount = pricingData?.totalAmount || 0;
  const basePrice = pricingData?.basePrice || Number(tour.price);
  const appliedDiscounts = pricingData?.appliedDiscounts || [];
  const appliedSurcharges = pricingData?.appliedSurcharges || [];

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      NotificationManager.error("Vui lòng chọn phương thức thanh toán");
      return;
    }

    setIsProcessing(true);

    const paymentData = {
      userId,
      userEmail,
      fullName,
      phone,
      guestSize: guests.length,
      guests: guestsWithPrices,
      singleRoomCount,
      tourId: tour._id,
      tourName: tour.title,
      totalAmount,
      basePrice,
      appliedDiscounts,
      appliedSurcharges,
      province,
      district,
      ward,
      addressDetail,
      bookAt: new Date()
    };

    try {
      if (selectedPaymentMethod === "Cash") {
        const res = await axios.post(
          `${BASE_URL}/payment/cash`,
          paymentData,
          { withCredentials: true }
        );

        if (res.data.success) {
          NotificationManager.success("Đặt tour thành công!");
          navigate("/thank-you");
        } else {
          NotificationManager.error(res.data.message || "Đặt tour thất bại");
        }
      } else if (selectedPaymentMethod === "MoMo") {
        // ✅ FIX: Remove client-side orderId generation - server will generate it
        const momoPaymentData = {
          ...paymentData,
          amount: totalAmount,
          orderInfo: `Thanh toán tour: ${tour.title}`,
          email: userEmail
        };

        const response = await axios.post(
          `${BASE_URL}/payment/momo`,
          momoPaymentData,
          { withCredentials: true }
        );

        if (response.data && response.data.payUrl) {
          window.location.href = response.data.payUrl;
        } else {
          NotificationManager.error("Không thể tạo thanh toán MoMo: " + (response.data?.message || "Vui lòng thử lại sau."));
        }
      }
    } catch (error) {
      console.error("❌ Lỗi thanh toán:", error);
      let errorMessage = "Thanh toán thất bại.";

      if (error.response) {
        errorMessage = `Lỗi: ${error.response.data?.message || error.message}`;
      } else if (error.request) {
        errorMessage = "Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối.";
      }

      NotificationManager.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="step-container">
      <div className="booking-section-title border-bottom pb-2 mb-3">
        <h5 className="fw-bold">Bước 3: Thanh toán</h5>
        <small className="text-muted">Xem lại thông tin và chọn phương thức thanh toán</small>
      </div>

      {/* Booking Summary */}
      <div className="booking-section mb-4">
        <div className="booking-section-header">
          <i className="ri-information-line section-icon"></i>
          <h6 className="fw-bold">Thông tin đặt tour</h6>
        </div>
        <div className="summary-detail-card border rounded p-3">
          <div className="mb-3">
            <strong>Tour:</strong> {tour.title}
          </div>
          <div className="mb-3">
            <strong>Ngày đi:</strong> {new Date(tour.startDate).toLocaleDateString("vi-VN")}
          </div>
          <div className="mb-3">
            <strong>Người đặt:</strong> {fullName} - {phone}
          </div>
          <div className="mb-3">
            <strong>Địa chỉ đón:</strong> {addressDetail}, {ward.name}, {district.name}, {province.name}
          </div>
          <div>
            <strong>Số khách:</strong> {guests.length} người
            {singleRoomCount > 0 && ` (${singleRoomCount} phòng đơn)`}
          </div>
        </div>
      </div>

      {/* Guest List */}
      <div className="booking-section mb-4">
        <div className="booking-section-header">
          <i className="ri-team-line section-icon"></i>
          <h6 className="fw-bold">Danh sách khách</h6>
        </div>
        <ListGroup>
          {guestsWithPrices.map((guest, index) => (
            <ListGroupItem key={index} className="d-flex justify-content-between align-items-center">
              <div>
                <strong>{guest.fullName}</strong>
                <br />
                <small className="text-muted">
                  {guest.age} tuổi - {
                    guest.guestType === 'adult' ? 'Người lớn' :
                    guest.guestType === 'child' ? 'Trẻ em' :
                    guest.guestType === 'infant' ? 'Em bé' :
                    guest.guestType === 'senior' ? 'Người cao tuổi' : 'Sinh viên'
                  }
                </small>
              </div>
              <strong className="text-primary">${guest.price.toLocaleString()}</strong>
            </ListGroupItem>
          ))}
        </ListGroup>
      </div>

      {/* Price Breakdown */}
      <div className="booking-section mb-4">
        <div className="booking-section-header">
          <i className="ri-money-dollar-circle-line section-icon"></i>
          <h6 className="fw-bold">Chi tiết giá</h6>
        </div>
        <div className="price-breakdown p-3 border rounded">
          <div className="d-flex justify-content-between mb-2">
            <span>Giá cơ bản:</span>
            <span>${basePrice.toLocaleString()}</span>
          </div>

          {appliedDiscounts && appliedDiscounts.length > 0 && (
            <>
              <hr />
              <div className="text-success mb-2">
                <strong>Giảm giá:</strong>
              </div>
              {appliedDiscounts.map((discount, idx) => (
                <div key={idx} className="d-flex justify-content-between mb-2 text-success">
                  <small>{discount.name}</small>
                  <small>-${discount.amount.toLocaleString()}</small>
                </div>
              ))}
            </>
          )}

          {appliedSurcharges && appliedSurcharges.length > 0 && (
            <>
              <hr />
              <div className="text-warning mb-2">
                <strong>Phụ thu:</strong>
              </div>
              {appliedSurcharges.map((surcharge, idx) => (
                <div key={idx} className="d-flex justify-content-between mb-2 text-warning">
                  <small>{surcharge.name}</small>
                  <small>+${surcharge.amount.toLocaleString()}</small>
                </div>
              ))}
            </>
          )}

          <hr />
          <div className="d-flex justify-content-between">
            <strong>Tổng cộng:</strong>
            <strong className="text-primary" style={{ fontSize: '1.5rem' }}>
              ${totalAmount.toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="booking-section mb-4">
        <div className="booking-section-header">
          <i className="ri-bank-card-line section-icon"></i>
          <h6 className="fw-bold">Chọn phương thức thanh toán</h6>
        </div>
        <div className="payment-methods">
          <div
            className={`payment-method-card border rounded p-3 mb-3 cursor-pointer ${selectedPaymentMethod === 'Cash' ? 'selected' : ''}`}
            onClick={() => setSelectedPaymentMethod('Cash')}
          >
            <div className="d-flex align-items-center">
              <input
                type="radio"
                name="paymentMethod"
                value="Cash"
                checked={selectedPaymentMethod === 'Cash'}
                onChange={() => setSelectedPaymentMethod('Cash')}
                className="me-3"
              />
              <div>
                <strong>💵 Thanh toán tiền mặt</strong>
                <br />
                <small className="text-muted">Thanh toán trực tiếp khi nhận tour</small>
              </div>
            </div>
          </div>

          <div
            className={`payment-method-card border rounded p-3 cursor-pointer ${selectedPaymentMethod === 'MoMo' ? 'selected' : ''}`}
            onClick={() => setSelectedPaymentMethod('MoMo')}
          >
            <div className="d-flex align-items-center">
              <input
                type="radio"
                name="paymentMethod"
                value="MoMo"
                checked={selectedPaymentMethod === 'MoMo'}
                onChange={() => setSelectedPaymentMethod('MoMo')}
                className="me-3"
              />
              <div>
                <strong>📱 Thanh toán qua MoMo</strong>
                <br />
                <small className="text-muted">Thanh toán ngay qua ví điện tử MoMo</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="d-flex gap-2">
        <Button
          className="btn btn-outline-secondary"
          onClick={prevStep}
          style={{ flex: 1 }}
          disabled={isProcessing}
        >
          ← Quay lại
        </Button>
        <Button
          className="btn primary__btn"
          onClick={handlePayment}
          style={{ flex: 2 }}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Đang xử lý...
            </>
          ) : selectedPaymentMethod === 'Cash' ? (
            "Xác nhận đặt tour"
          ) : (
            "Thanh toán qua MoMo"
          )}
        </Button>
      </div>
    </div>
  );
};

export default Step3Payment;
