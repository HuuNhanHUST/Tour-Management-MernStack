import React, { useState, useContext } from "react";
import "./booking.css";
import {
  Form,
  FormGroup,
  ListGroup,
  ListGroupItem,
  Button
} from "reactstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

const Booking = ({ tour, avgRating }) => {
  const {
    price,
    reviews,
    title,
    startDate,
    endDate,
    maxGroupSize,
    currentBookings
  } = tour;

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [credentials, setCredentials] = useState({
    userId: user?._id || "",
    userEmail: user?.email || "",
    fullName: "",
    phone: "",
    guestSize: 1,
  });

  const availableSlots = maxGroupSize - currentBookings;
  const isTourExpired = new Date() > new Date(endDate);

  const handleChange = (e) => {
    setCredentials((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const serviceFee = 10;
  const totalAmount =
    Number(price) * Number(credentials.guestSize) + Number(serviceFee);

  const handerClick = (e) => {
    e.preventDefault();

    if (!user) {
      alert("Vui lòng đăng nhập để đặt tour!");
      navigate("/login");
      return;
    }

    if (isTourExpired) {
      alert("Tour này đã kết thúc. Không thể đặt nữa.");
      return;
    }

    if (credentials.guestSize <= 0) {
      alert("Số lượng người phải lớn hơn 0.");
      return;
    }

    if (credentials.guestSize > availableSlots) {
      alert(`Chỉ còn lại ${availableSlots} chỗ trống.`);
      return;
    }

    navigate("/thank-you");
  };

  const handleMomoPayment = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để thanh toán!");
      navigate("/login");
      return;
    }

    if (isTourExpired) {
      alert("Tour đã kết thúc. Không thể thanh toán.");
      return;
    }

    if (credentials.guestSize <= 0) {
      alert("Số lượng người phải lớn hơn 0.");
      return;
    }

    if (credentials.guestSize > availableSlots) {
      alert(`Chỉ còn lại ${availableSlots} chỗ trống.`);
      return;
    }

    const validAmount = Math.max(1000, Math.floor(Number(totalAmount)));

    try {
      const response = await axios.post("http://localhost:4000/api/v1/payment/momo", {
        amount: validAmount,
        orderId: `ORDER_${Date.now()}`,
        orderInfo: `Thanh toán tour: ${title}`,
        userId: user._id,
        email: user.email,
        tourId: tour._id,
        tourName: tour.title,
        fullName: credentials.fullName,
        phone: credentials.phone,
        quantity: credentials.guestSize,
        departureDate: startDate
      });

      if (response.data && response.data.payUrl) {
        window.location.href = response.data.payUrl;
      } else {
        alert("Không thể tạo thanh toán MoMo.");
      }
    } catch (error) {
      console.error("❌ Lỗi gọi MoMo:", error?.response?.data || error.message);
      alert("Thanh toán thất bại.");
    }
  };

  return (
    <div className="booking">
      <div className="booking__top d-flex align-items-center justify-content-between">
        <h3>
          ${price}
          <span>/ per person</span>
        </h3>
        <span className="tour__rating d-flex align-items-center">
          <i className="ri-star-line"></i>
          {avgRating === 0 ? "Chưa có đánh giá nào" : avgRating}({reviews?.length})
        </span>
      </div>

      <div className="booking__form">
        <h5>Thông tin đặt tour</h5>

        {isTourExpired && (
          <p className="text-danger fw-bold">❌ Tour này đã kết thúc.</p>
        )}

        {availableSlots <= 0 && (
          <p className="text-danger fw-bold">❌ Tour đã hết chỗ.</p>
        )}

        {availableSlots > 0 && !isTourExpired && (
          <p className="text-success fw-bold">✅ Còn lại: {availableSlots} chỗ</p>
        )}

        <Form className="booking__info-form" onSubmit={handerClick}>
          <FormGroup>
            <input
              type="text"
              placeholder="Họ tên"
              id="fullName"
              required
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <input
              type="number"
              placeholder="Số điện thoại"
              id="phone"
              required
              onChange={handleChange}
            />
          </FormGroup>

          <FormGroup>
            <p><strong>Ngày đi:</strong> {startDate ? new Date(startDate).toLocaleDateString("vi-VN") : "-"}</p>
            <p><strong>Ngày về:</strong> {endDate ? new Date(endDate).toLocaleDateString("vi-VN") : "-"}</p>
          </FormGroup>

          <FormGroup>
            <input
              type="number"
              placeholder="Số lượng người"
              id="guestSize"
              min="1"
              max={availableSlots}
              value={credentials.guestSize}
              required
              onChange={handleChange}
            />
          </FormGroup>
        </Form>
      </div>

      <div className="booking__bottom">
        <ListGroup>
          <ListGroupItem className="border-0 px-0">
            <h5 className="d-flex align-items-center gap-1">
              ${price} <i className="ri-close-line"></i> {credentials.guestSize} Người
            </h5>
            <span>${price * credentials.guestSize}</span>
          </ListGroupItem>
          <ListGroupItem className="border-0 px-0">
            <h5>Phí dịch vụ</h5>
            <span>${serviceFee}</span>
          </ListGroupItem>
          <ListGroupItem className="border-0 px-0 total">
            <h5>Tổng cộng</h5>
            <span>${totalAmount}</span>
          </ListGroupItem>
        </ListGroup>

        <Button
          className="btn primary__btn w-100 mt-4"
          onClick={handerClick}
          disabled={isTourExpired || availableSlots <= 0}
        >
          Đặt Ngay
        </Button>

        <Button
          type="button"
          className="btn btn-danger w-100 mt-3"
          onClick={handleMomoPayment}
          disabled={isTourExpired || availableSlots <= 0}
        >
          Thanh toán qua MoMo
        </Button>
      </div>
    </div>
  );
};

export default Booking;
