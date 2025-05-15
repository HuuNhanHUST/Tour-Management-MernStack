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
  const { price, reviews, title } = tour;
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [credentials, setCredentials] = useState({
    userId: user?._id || "",
    userEmail: user?.email || "",
    fullName: "",
    phone: "",
    guestSize: 1,
    bookAt: ""
  });

  const handleChange = (e) => {
    setCredentials((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const serviceFee = 10;
  const totalAmount =
    Number(price) * Number(credentials.guestSize) + Number(serviceFee);

  const handerClick = (e) => {
    e.preventDefault();

    // ✅ Nếu chưa đăng nhập thì không cho đặt tour
    if (!user) {
      alert("Vui lòng đăng nhập để đặt tour!");
      navigate("/login");
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

  const validAmount = Math.max(1000, Math.floor(Number(totalAmount)));

  try {
    const response = await axios.post("http://localhost:4000/api/v1/payment/momo", {
      amount: validAmount,
      orderId: `ORDER_${Date.now()}`,
      orderInfo: `Thanh toán tour: ${title}`,
      userId: user._id,
      email: user.email,                          // ✅ Gửi email
      tourId: tour._id,                           // ✅ Tour ID
      tourName: tour.title,                       // ✅ Tour name
      fullName: credentials.fullName,             // ✅ Tên khách
      phone: credentials.phone,                   // ✅ SĐT
      quantity: credentials.guestSize             // ✅ Số lượng người
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
          {avgRating === 0 ? "Chưa có đánh giá nào" : avgRating}(
          {reviews?.length})
        </span>
      </div>

      <div className="booking__form">
        <h5>Information</h5>
        <Form className="booking__info-form" onSubmit={handerClick}>
          <FormGroup>
            <input
              type="text"
              placeholder="Full Name"
              id="fullName"
              required
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <input
              type="number"
              placeholder="Phone"
              id="phone"
              required
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup className="d-flex align-items-center gap-3">
            <input
              type="date"
              id="bookAt"
              required
              onChange={handleChange}
            />
            <input
              type="number"
              placeholder="Guest"
              id="guestSize"
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
              ${price}
              <i className="ri-close-line"></i> 1 Người
            </h5>
            <span>${price}</span>
          </ListGroupItem>
          <ListGroupItem className="border-0 px-0">
            <h5>Service charge</h5>
            <span>${serviceFee}</span>
          </ListGroupItem>
          <ListGroupItem className="border-0 px-0 total">
            <h5>ToTal</h5>
            <span>${totalAmount}</span>
          </ListGroupItem>
        </ListGroup>

        <Button className="btn primary__btn w-100 mt-4" onClick={handerClick}>
          Đặt NgayNgay
        </Button>

        <Button
          type="button"
          className="btn btn-danger w-100 mt-3"
          onClick={handleMomoPayment}
        >
          Thanh toán qua MoMo
        </Button>
      </div>
    </div>
  );
};

export default Booking;
