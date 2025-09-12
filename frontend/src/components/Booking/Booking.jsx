import React, { useState, useContext, useCallback, useEffect } from "react";
import "./booking.css";
import "./price-details.css";
import LocationSelect from "../Location/LocationSelect";
import ThongTinGiaTour from "./ThongTinGiaTour";
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
import { BASE_URL } from "../../utils/config.js";

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

  const [location, setLocation] = useState({
    province: { code: "", name: "" },
    district: { code: "", name: "" },
    ward: { code: "", name: "" },
  });

  const [addressDetail, setAddressDetail] = useState("");
  const [guests, setGuests] = useState([
    { fullName: "", age: 30, guestType: "adult" }
  ]);
  const [singleRoomCount, setSingleRoomCount] = useState(0);
  const [pricingData, setPricingData] = useState(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);

  const maxGroup = Number(maxGroupSize) || 0;
  const currentBook = Number(currentBookings) || 0;
  const availableSlots = maxGroup - currentBook;

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const isTourExpired = now > end;
  const isTourOngoing = now >= start && now <= end;
  
  // Tính giá khi người dùng thay đổi thông tin
  useEffect(() => {
    const calculatePrice = async () => {
      if (!tour._id || guests.length === 0) return;
      
      try {
        setIsCalculatingPrice(true);
        const response = await axios.post(
          `${BASE_URL}/pricing/calculate`,
          {
            tourId: tour._id,
            bookingDate: new Date(),
            guests: guests,
            singleRoomCount: singleRoomCount
          },
          { withCredentials: true }
        );
        
        console.log("Pricing calculation response:", response.data);
        
        if (response.data.success && response.data.data) {
          console.log("Base price from API:", response.data.data.basePrice);
          console.log("Guest prices:", response.data.data.guestPrices);
          setPricingData(response.data.data);
        } else {
          console.error("API returned success=false or missing data");
        }
      } catch (error) {
        console.error("Lỗi tính giá:", error);
      } finally {
        setIsCalculatingPrice(false);
      }
    };
    
    // Chỉ tính giá khi có ít nhất 1 khách
    if (guests.length > 0) {
      calculatePrice();
    }
  }, [tour._id, guests, singleRoomCount]);

  const handleChange = (e) => {
    setCredentials((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleLocationChange = useCallback((loc) => {
    setLocation(loc);
  }, []);

  const serviceFee = 10;
  const totalAmount = pricingData ? pricingData.totalAmount + serviceFee : Number(price) * Number(credentials.guestSize) + serviceFee;

  // Thêm khách vào danh sách
  const addGuest = () => {
    if (guests.length >= availableSlots) {
      alert(`Không thể thêm quá ${availableSlots} khách`);
      return;
    }
    setGuests([...guests, { fullName: "", age: 30, guestType: "adult" }]);
    setCredentials(prev => ({ ...prev, guestSize: guests.length + 1 }));
  };
  
  // Xóa khách khỏi danh sách
  const removeGuest = (index) => {
    if (guests.length <= 1) {
      alert("Phải có ít nhất 1 khách");
      return;
    }
    const newGuests = [...guests];
    newGuests.splice(index, 1);
    setGuests(newGuests);
    setCredentials(prev => ({ ...prev, guestSize: newGuests.length }));
  };
  
  // Cập nhật thông tin khách
  const updateGuest = (index, field, value) => {
    const newGuests = [...guests];
    newGuests[index][field] = value;
    
    // If changing age or guest type, we need to recalculate pricing
    if (field === 'age' || field === 'guestType') {
      // Reset pricing data to force recalculation
      setPricingData(null);
      setIsCalculatingPrice(true);
    }
    
    setGuests(newGuests);
  };

  const handerClick = async (e) => {
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

    if (isTourOngoing) {
      alert("Tour đang diễn ra. Không thể đặt lúc này.");
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

    if (
      !location.province.code ||
      !location.district.code ||
      !location.ward.code ||
      !addressDetail.trim()
    ) {
      alert("Vui lòng chọn đầy đủ địa chỉ tỉnh, huyện, xã và nhập chi tiết địa chỉ.");
      return;
    }

    try {
      // Kiểm tra thông tin khách
      const invalidGuests = guests.filter(g => !g.fullName || g.age === null);
      if (invalidGuests.length > 0) {
        alert("Vui lòng nhập đầy đủ thông tin cho tất cả khách hàng");
        return;
      }

      // Kiểm tra thông tin liên hệ
      if (!credentials.fullName || !credentials.phone) {
        alert("Vui lòng nhập đầy đủ họ tên và số điện thoại liên hệ");
        return;
      }

      // Ensure we have a valid base price
      const validBasePrice = Number(pricingData?.basePrice || price || 0);
      
      // Ensure base price is a positive number
      const finalBasePrice = isNaN(validBasePrice) || validBasePrice <= 0 ? Number(price) || 1000000 : validBasePrice;
      
      console.log("Using base price for booking:", finalBasePrice);
      
      // Ensure we have a valid price even if all else fails
      if (isNaN(finalBasePrice) || finalBasePrice <= 0) {
        alert("Không thể xác định giá cho tour này. Vui lòng thử lại hoặc liên hệ với quản trị viên.");
        return;
      }
      
      // Prepare guest data with prices
      const guestsWithPrices = guests.map((guest, index) => {
        // Get price from pricing API response if available
        let guestPrice = finalBasePrice; // Default to base price
        
        // If we have pricing data from the API, use that
        if (pricingData && pricingData.guestPrices && pricingData.guestPrices[index]) {
          const apiPrice = Number(pricingData.guestPrices[index].finalPrice);
          guestPrice = isNaN(apiPrice) || apiPrice <= 0 ? finalBasePrice : apiPrice;
          console.log(`Guest ${index + 1} price from API:`, guestPrice);
        } else {
          console.log(`Guest ${index + 1} using default price:`, guestPrice);
        }
        
        return {
          ...guest,
          price: guestPrice,
          discounts: [],
          surcharges: []
        };
      });

      // Calculate total amount if not available from pricing API
      const calculatedTotalAmount = guestsWithPrices.reduce((sum, guest) => sum + guest.price, 0) + serviceFee;
      
      const bookingData = {
        userId: credentials.userId,
        userEmail: credentials.userEmail,
        fullName: credentials.fullName,
        phone: credentials.phone,
        guestSize: credentials.guestSize,
        guests: guestsWithPrices,
        singleRoomCount: singleRoomCount,
        tourId: tour._id,
        tourName: tour.title,
        totalAmount: Number(totalAmount) || calculatedTotalAmount,
        basePrice: finalBasePrice,
        appliedDiscounts: pricingData?.appliedDiscounts || [],
        appliedSurcharges: pricingData?.appliedSurcharges || [],
        paymentMethod: "Cash",
        bookAt: new Date(),
        province: location.province,
        district: location.district,
        ward: location.ward,
        addressDetail,
      };
      
      // Log the full booking data for debugging
      console.log("Full booking data being sent:", JSON.stringify(bookingData));

      console.log("Đang gửi dữ liệu đặt tour:", bookingData);

      const res = await axios.post(`${BASE_URL}/booking`, 
        bookingData, 
        { withCredentials: true } 
      );

      if (res.data.success) {
        alert("Đặt tour thành công!");
        navigate("/thank-you");
      } else {
        alert("Đặt tour thất bại: " + res.data.message);
      }
    } catch (error) {
      console.error("Lỗi đặt tour:", error);
      let errorMessage = "Có lỗi xảy ra khi đặt tour.";
      
      if (error.response) {
        console.log("Chi tiết lỗi:", error.response.data);
        
        // Kiểm tra lỗi validation từ MongoDB
        if (error.response.data && error.response.data.error) {
          const mongoError = error.response.data.error;
          if (mongoError.includes("validation failed") || mongoError.includes("required")) {
            errorMessage = `Lỗi xác thực dữ liệu: ${mongoError}`;
          } else {
            errorMessage = `Lỗi: ${error.response.status} - ${error.response.data?.message || mongoError}`;
          }
        } else {
          errorMessage = `Lỗi: ${error.response.status} - ${error.response.data?.message || error.message}`;
        }
      } else if (error.request) {
        errorMessage = "Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối.";
      }
      
      alert(errorMessage);
    }
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

    if (isTourOngoing) {
      alert("Tour đang diễn ra. Không thể thanh toán.");
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

    if (
      !location.province.code ||
      !location.district.code ||
      !location.ward.code ||
      !addressDetail.trim()
    ) {
      alert("Vui lòng chọn đầy đủ địa chỉ tỉnh, huyện, xã và nhập chi tiết địa chỉ.");
      return;
    }
    
    // Kiểm tra thông tin liên hệ
    if (!credentials.fullName || !credentials.phone) {
      alert("Vui lòng nhập đầy đủ họ tên và số điện thoại liên hệ");
      return;
    }
    
    // Kiểm tra thông tin khách
    const invalidGuests = guests.filter(g => !g.fullName || g.age === null);
    if (invalidGuests.length > 0) {
      alert("Vui lòng nhập đầy đủ thông tin cho tất cả khách hàng");
      return;
    }

    const validAmount = Math.max(1000, Math.floor(Number(totalAmount)));

    try {
      // Ensure we have a valid base price
      const validBasePrice = Number(pricingData?.basePrice || price || 0);
      
      // Ensure base price is a positive number
      const finalBasePrice = isNaN(validBasePrice) || validBasePrice <= 0 ? Number(price) : validBasePrice;
      
      console.log("Using base price for MoMo payment:", finalBasePrice);
      
      // Prepare guest data with prices
      const guestsWithPrices = guests.map((guest, index) => {
        // Get price from pricing API response if available
        let guestPrice = finalBasePrice; // Default to base price
        
        // If we have pricing data from the API, use that
        if (pricingData && pricingData.guestPrices && pricingData.guestPrices[index]) {
          const apiPrice = Number(pricingData.guestPrices[index].finalPrice);
          guestPrice = isNaN(apiPrice) || apiPrice <= 0 ? finalBasePrice : apiPrice;
          console.log(`Guest ${index + 1} price for MoMo:`, guestPrice);
        } else {
          console.log(`Guest ${index + 1} using default price for MoMo:`, guestPrice);
        }
        
        return {
          ...guest,
          price: guestPrice,
          discounts: [],
          surcharges: []
        };
      });
      
      // Calculate total amount if needed
      const calculatedTotalAmount = guestsWithPrices.reduce((sum, guest) => sum + guest.price, 0) + serviceFee;
      const finalAmount = Math.max(1000, Math.floor(calculatedTotalAmount || Number(totalAmount) || validAmount));

      const paymentData = {
        amount: finalAmount,
        orderId: `ORDER_${Date.now()}`,
        orderInfo: `Thanh toán tour: ${title}`,
        userId: user._id,
        email: user.email,
        tourId: tour._id,
        tourName: tour.title,
        fullName: credentials.fullName,
        phone: credentials.phone,
        quantity: credentials.guestSize,
        departureDate: startDate,
        guests: guestsWithPrices,
        singleRoomCount: singleRoomCount,
        basePrice: finalBasePrice,
        appliedDiscounts: pricingData?.appliedDiscounts || [],
        appliedSurcharges: pricingData?.appliedSurcharges || [],

        province: location.province,
        district: location.district,
        ward: location.ward,
        addressDetail,
      };

      console.log("Đang gửi yêu cầu thanh toán MoMo:", paymentData);
      
      const response = await axios.post(`${BASE_URL}/payment/momo`, 
        paymentData, 
        { withCredentials: true }
      );

      if (response.data && response.data.payUrl) {
        window.location.href = response.data.payUrl;
      } else {
        alert("Không thể tạo thanh toán MoMo: " + (response.data?.message || "Vui lòng thử lại sau."));
      }
    } catch (error) {
      console.error("❌ Lỗi gọi MoMo:", error);
      let errorMessage = "Thanh toán thất bại.";
      
      if (error.response) {
        console.log("Chi tiết lỗi:", error.response.data);
        errorMessage = `Lỗi thanh toán: ${error.response.status} - ${error.response.data?.message || error.message}`;
      } else if (error.request) {
        errorMessage = "Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối.";
      }
      
      alert(errorMessage);
    }
  };

  return (
    <div className="booking">
      <div className="booking__top d-flex align-items-center justify-content-between">
        <div>
          <h3>
            ${price}
            <span>/ giá cơ bản</span>
          </h3>
          <h4>{title}</h4>
          <small className="text-muted">* Giá có thể thay đổi theo tuổi, thời điểm đặt, và các yêu cầu đặc biệt</small>
        </div>
        <span className="tour__rating d-flex align-items-center">
          <i className="ri-star-line"></i>
          {avgRating === 0 ? "Chưa có đánh giá nào" : avgRating}({reviews?.length})
        </span>
      </div>

      <div className="booking__form">
        <div className="booking-section-title border-bottom pb-2 mb-3">
          <h5 className="fw-bold">Thông tin đặt tour</h5>
          
          {isTourExpired && (
            <p className="text-danger fw-bold mb-0">❌ Tour này đã kết thúc.</p>
          )}

          {isTourOngoing && (
            <p className="text-danger fw-bold mb-0">❌ Tour đang diễn ra. Không thể đặt.</p>
          )}

          {availableSlots <= 0 && (
            <p className="text-danger fw-bold mb-0">❌ Tour đã hết chỗ.</p>
          )}

          {availableSlots > 0 && !isTourExpired && !isTourOngoing && (
            <p className="text-success fw-bold mb-0">✅ Còn nhận: {availableSlots} chỗ</p>
          )}
        </div>

        <Form className="booking__info-form" onSubmit={handerClick}>
          {/* Thông tin liên hệ */}
          <div className="booking-section mb-4">
            <h6 className="fw-bold mb-3">Thông tin liên hệ</h6>
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
          </div>
          
          {/* Thông tin tour */}
          <div className="booking-section mb-4">
            <h6 className="fw-bold mb-3">Thông tin tour</h6>
            <div className="tour-date-info p-3 bg-light rounded mb-3">
              <div className="d-flex justify-content-between mb-2">
                <span>Ngày đi:</span>
                <strong>{startDate ? new Date(startDate).toLocaleDateString("vi-VN") : "-"}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Ngày về:</span>
                <strong>{endDate ? new Date(endDate).toLocaleDateString("vi-VN") : "-"}</strong>
              </div>
            </div>
          </div>
          
          {/* Thông tin khách đi tour */}
          <div className="booking-section mb-4">
            <h6 className="fw-bold mb-3">Thông tin khách đi tour</h6>
            
            {guests.map((guest, index) => (
            <div key={index} className="guest-info border p-3 mb-3 rounded">
              <div className="d-flex justify-content-between mb-2">
                <h6>Khách {index + 1}</h6>
                {guests.length > 1 && (
                  <button 
                    type="button" 
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeGuest(index)}
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                )}
              </div>
              
              <FormGroup>
                <input
                  type="text"
                  placeholder="Họ tên khách"
                  required
                  value={guest.fullName}
                  onChange={e => updateGuest(index, 'fullName', e.target.value)}
                />
              </FormGroup>
              
              <div className="row">
                <div className="col-md-6">
                  <FormGroup>
                    <input
                      type="number"
                      placeholder="Tuổi"
                      required
                      min="0"
                      max="120"
                      value={guest.age}
                      onChange={e => updateGuest(index, 'age', parseInt(e.target.value) || 0)}
                    />
                  </FormGroup>
                </div>
                <div className="col-md-6">
                  <FormGroup>
                    <select
                      className="form-control"
                      value={guest.guestType}
                      onChange={e => updateGuest(index, 'guestType', e.target.value)}
                    >
                      <option value="adult">Người lớn</option>
                      <option value="child">Trẻ em</option>
                      <option value="infant">Em bé</option>
                      <option value="senior">Người cao tuổi</option>
                      <option value="student">Sinh viên</option>
                    </select>
                  </FormGroup>
                </div>
              </div>
            </div>
          ))}
          
          <Button 
            type="button" 
            color="info" 
            outline
            className="w-100 mb-3"
            onClick={addGuest}
            disabled={guests.length >= availableSlots}
          >
            <i className="ri-add-line"></i> Thêm khách
          </Button>
          
          <FormGroup className="mt-2">
            <div className="d-flex justify-content-between align-items-center">
              <label htmlFor="singleRoomCount">Phòng đơn:</label>
              <input
                type="number"
                id="singleRoomCount"
                min="0"
                max={guests.length}
                value={singleRoomCount}
                onChange={e => setSingleRoomCount(parseInt(e.target.value) || 0)}
                className="form-control"
                style={{width: "70px"}}
              />
            </div>
          </FormGroup>
          </div> {/* End of Thông tin khách đi tour section */}

          {/* Địa chỉ đón khách */}
          <div className="booking-section mb-4">
            <h6 className="fw-bold mb-3">Địa chỉ đón khách</h6>
            <FormGroup>
              <LocationSelect onChange={handleLocationChange} />
            </FormGroup>

            <FormGroup>
              <input
                type="text"
                placeholder="Số nhà, đường, thôn xóm..."
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                required
              />
            </FormGroup>
          </div>

          <Button
            className="btn primary__btn w-100 mt-4"
            type="submit"
            disabled={isTourExpired || isTourOngoing || availableSlots <= 0}
          >
            Đặt Ngay
          </Button>
        </Form>
      </div>

      <div className="booking__bottom">
        <ListGroup>
          {isCalculatingPrice ? (
            <ListGroupItem className="border-0 px-0 text-center py-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Đang tính giá...</p>
            </ListGroupItem>
          ) : pricingData ? (
            <div className="booking__price-details">
              <div className="price-details-header">
                <h5>Chi tiết giá</h5>
              </div>
              
              <div className="price-detail-table">
                {pricingData.guestPrices?.map((guestPrice, index) => {
                  const hasDiscount = guestPrice.basePrice > guestPrice.finalPrice;
                  const discountPercent = hasDiscount ? 
                    Math.round((1 - guestPrice.finalPrice / guestPrice.basePrice) * 100) : 0;
                  
                  let guestTypeLabel = "";
                  switch(guests[index]?.guestType) {
                    case 'adult': guestTypeLabel = "adult, từ 18 tuổi"; break;
                    case 'child': guestTypeLabel = "children, 2-12 tuổi"; break;
                    case 'infant': guestTypeLabel = "infant, dưới 2 tuổi"; break;
                    case 'senior': guestTypeLabel = "senior, từ 72 tuổi"; break;
                    case 'student': guestTypeLabel = "student"; break;
                    default: guestTypeLabel = guestPrice.guestType;
                  }
                  
                  return (
                    <div key={index} className="price-detail-row guest-price-row">
                      <div className="guest-type-info">
                        <span className="guest-name">{guests[index]?.fullName || `Khách ${index+1}`}</span>
                        <span className="guest-type">({guestTypeLabel})</span>
                      </div>
                      <div className="price-value-container">
                        {hasDiscount && (
                          <>
                            <span className="discount-badge">-{discountPercent}%</span>
                            <span className="original-price">${guestPrice.basePrice.toLocaleString()}</span>
                          </>
                        )}
                        <span className="price-value">${guestPrice.finalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
                
                {pricingData.appliedDiscounts?.length > 0 && (
                  <>
                    <div className="price-modifier-row">
                      <strong>Khuyến mãi áp dụng</strong>
                    </div>
                    {pricingData.appliedDiscounts.map((discount, index) => (
                      <div key={index} className="price-detail-row discount-row">
                        <span className="price-label">{discount.name}</span>
                        <span className="price-value">-${discount.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </>
                )}
                
                {pricingData.appliedSurcharges?.length > 0 && (
                  <>
                    <div className="price-modifier-row">
                      <strong>Phụ thu</strong>
                    </div>
                    {pricingData.appliedSurcharges.map((surcharge, index) => (
                      <div key={index} className="price-detail-row surcharge-row">
                        <span className="price-label">{surcharge.name}</span>
                        <span className="price-value">+${surcharge.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </>
                )}
                
                {singleRoomCount > 0 && (
                  <div className="price-detail-row">
                    <span className="price-label">Phòng đơn x{singleRoomCount}</span>
                    <span className="price-value">Xem trong phụ thu</span>
                  </div>
                )}
                
                <div className="price-detail-row service-fee-row">
                  <span className="price-label">Phí dịch vụ</span>
                  <span className="price-value">${serviceFee.toLocaleString()}</span>
                </div>
                
                <div className="price-detail-row total-row">
                  <span className="price-label">Tổng cộng</span>
                  <span className="price-value">${totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <ListGroupItem className="border-0 px-0">
              <h5 className="d-flex align-items-center gap-1">
                ${price} <i className="ri-close-line"></i> {credentials.guestSize} Người
              </h5>
              <span>${price * credentials.guestSize}</span>
            </ListGroupItem>
          )}
          
        </ListGroup>

        <div className="mt-3">
          <ThongTinGiaTour tourId={tour._id} basePrice={tour.price} />
        </div>

        <Button
          type="button"
          className="btn btn-danger w-100 mt-3"
          onClick={handleMomoPayment}
          disabled={isTourExpired || isTourOngoing || availableSlots <= 0}
        >
          Thanh toán qua MoMo
        </Button>
      </div>
    </div>
  );
};

export default Booking;
