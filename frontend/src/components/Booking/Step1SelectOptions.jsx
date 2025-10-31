import React, { useState, useEffect } from "react";
import { Button, FormGroup } from "reactstrap";
import axios from "axios";
import { BASE_URL } from "../../utils/config.js";
import NotificationManager from "../shared/NotificationManager";
import ThongTinGiaTour from "./ThongTinGiaTour";

const Step1SelectOptions = ({ tour, bookingData, updateBookingData, nextStep }) => {
  const [localGuests, setLocalGuests] = useState(bookingData.guests);
  const [localSingleRoomCount, setLocalSingleRoomCount] = useState(bookingData.singleRoomCount);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [pricingError, setPricingError] = useState(false);
  const [pricingData, setPricingData] = useState(null);

  const maxGroup = Number(tour.maxGroupSize) || 0;
  const currentBook = Number(tour.currentBookings) || 0;
  const availableSlots = maxGroup - currentBook;

  const now = new Date();
  const start = new Date(tour.startDate);
  const end = new Date(tour.endDate);

  const isTourExpired = now > end;
  const isTourOngoing = now >= start && now <= end;

  // Auto-calculate price when guests or singleRoomCount changes
  useEffect(() => {
    const calculatePrice = async () => {
      if (!tour._id || localGuests.length === 0) return;

      try {
        setIsCalculatingPrice(true);
        setPricingError(false);

        const response = await axios.post(
          `${BASE_URL}/pricing/calculate`,
          {
            tourId: tour._id,
            bookingDate: new Date(),
            guests: localGuests,
            singleRoomCount: localSingleRoomCount
          },
          { withCredentials: true }
        );

        if (response.data.success && response.data.data) {
          setPricingData(response.data.data);
          setPricingError(false);
        } else {
          setPricingError(true);
          NotificationManager.error("Không thể tính giá tour. Vui lòng thử lại!");
        }
      } catch (error) {
        console.error("Lỗi tính giá:", error);
        setPricingError(true);
        NotificationManager.error("Không thể kết nối đến server để tính giá!");
      } finally {
        setIsCalculatingPrice(false);
      }
    };

    if (localGuests.length > 0) {
      calculatePrice();
    }
  }, [tour._id, localGuests, localSingleRoomCount]);

  const addGuest = () => {
    if (localGuests.length >= availableSlots) {
      NotificationManager.warning(`Không thể thêm quá ${availableSlots} khách`);
      return;
    }
    setLocalGuests([...localGuests, { fullName: "", age: 30, guestType: "adult" }]);
  };

  const removeGuest = (index) => {
    if (localGuests.length <= 1) {
      NotificationManager.warning("Phải có ít nhất 1 khách");
      return;
    }
    const newGuests = [...localGuests];
    newGuests.splice(index, 1);
    setLocalGuests(newGuests);
  };

  const updateGuest = (index, field, value) => {
    const newGuests = [...localGuests];
    newGuests[index][field] = value;

    // Auto-detect guest type based on age
    if (field === 'age') {
      const age = parseInt(value) || 0;
      let autoGuestType = 'adult';

      if (age >= 0 && age < 2) {
        autoGuestType = 'infant';
      } else if (age >= 2 && age < 18) {
        autoGuestType = 'child';
      } else if (age >= 18 && age < 65) {
        autoGuestType = 'adult';
      } else if (age >= 65) {
        autoGuestType = 'senior';
      }

      newGuests[index]['guestType'] = autoGuestType;
    }

    setLocalGuests(newGuests);
  };

  const handleContinue = () => {
    // Validation
    if (localGuests.length === 0) {
      NotificationManager.error("Vui lòng thêm ít nhất 1 khách");
      return;
    }

    if (pricingError) {
      NotificationManager.error("Vui lòng đợi tính giá thành công trước khi tiếp tục");
      return;
    }

    if (isCalculatingPrice) {
      NotificationManager.warning("Đang tính giá, vui lòng đợi...");
      return;
    }

    if (!pricingData) {
      NotificationManager.error("Chưa có thông tin giá. Vui lòng thử lại!");
      return;
    }

    // Update parent state with all data including pricing
    updateBookingData({
      guests: localGuests,
      guestSize: localGuests.length,
      singleRoomCount: localSingleRoomCount,
      pricingData: pricingData,
    });

    nextStep();
  };

  return (
    <div className="step-container">
      <div className="booking-section-title border-bottom pb-2 mb-3">
        <h5 className="fw-bold">Bước 1: Chọn số lượng khách và tùy chọn</h5>

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

      {/* Tour Date Info */}
      <div className="booking-section mb-4">
        <div className="booking-section-header">
          <i className="ri-calendar-line section-icon"></i>
          <h6 className="fw-bold">Thời gian tour</h6>
        </div>
        <div className="tour-date-info p-3 bg-light rounded">
          <div className="d-flex justify-content-between mb-2">
            <span>Ngày đi:</span>
            <strong>{tour.startDate ? new Date(tour.startDate).toLocaleDateString("vi-VN") : "-"}</strong>
          </div>
          <div className="d-flex justify-content-between">
            <span>Ngày về:</span>
            <strong>{tour.endDate ? new Date(tour.endDate).toLocaleDateString("vi-VN") : "-"}</strong>
          </div>
        </div>
      </div>

      {/* Guest Selection */}
      <div className="booking-section mb-4">
        <div className="booking-section-header">
          <i className="ri-group-line section-icon"></i>
          <h6 className="fw-bold">Thông tin khách đi tour</h6>
        </div>

        {localGuests.map((guest, index) => (
          <div key={index} className="guest-info border p-3 mb-3 rounded">
            <div className="d-flex justify-content-between mb-2">
              <h6>Khách {index + 1}</h6>
              {localGuests.length > 1 && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => removeGuest(index)}
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              )}
            </div>

            <div className="row">
              <div className="col-md-6">
                <FormGroup>
                  <label>Tuổi</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Tuổi"
                    min="0"
                    max="120"
                    value={guest.age}
                    onChange={e => updateGuest(index, 'age', parseInt(e.target.value) || 0)}
                  />
                </FormGroup>
              </div>
              <div className="col-md-6">
                <FormGroup>
                  <label>Loại khách</label>
                  <select
                    className="form-control"
                    value={guest.guestType}
                    onChange={e => updateGuest(index, 'guestType', e.target.value)}
                  >
                    <option value="adult">Người lớn (18-64 tuổi)</option>
                    <option value="child">Trẻ em (2-17 tuổi)</option>
                    <option value="infant">Em bé (&lt;2 tuổi)</option>
                    <option value="senior">Người cao tuổi (≥65 tuổi)</option>
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
          disabled={localGuests.length >= availableSlots}
        >
          <i className="ri-add-line"></i> Thêm khách
        </Button>

        <FormGroup className="mt-3">
          <label htmlFor="singleRoomCount">Số phòng đơn (nếu có):</label>
          <input
            type="number"
            id="singleRoomCount"
            className="form-control"
            min="0"
            max={localGuests.length}
            value={localSingleRoomCount}
            onChange={e => setLocalSingleRoomCount(parseInt(e.target.value) || 0)}
          />
          <small className="text-muted">Phụ thu cho phòng đơn (nếu áp dụng)</small>
        </FormGroup>
      </div>

      {/* Pricing Rules Info */}
      <div className="booking-section mb-4">
        <ThongTinGiaTour tourId={tour._id} />
      </div>

      {/* Price Preview */}
      <div className="booking-section mb-4">
        <div className="booking-section-header">
          <i className="ri-money-dollar-circle-line section-icon"></i>
          <h6 className="fw-bold">Ước tính giá</h6>
        </div>
        {isCalculatingPrice ? (
          <div className="text-center py-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Đang tính giá...</p>
          </div>
        ) : pricingError ? (
          <div className="alert alert-danger" role="alert">
            <i className="ri-error-warning-line"></i>
            <p className="mb-0 mt-2"><strong>Không thể tính giá tour!</strong></p>
            <small>Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.</small>
          </div>
        ) : pricingData ? (
          <div className="price-preview p-3 bg-light rounded">
            <div className="d-flex justify-content-between mb-2">
              <span>Số khách:</span>
              <strong>{localGuests.length} người</strong>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Phòng đơn:</span>
              <strong>{localSingleRoomCount} phòng</strong>
            </div>
            <hr />
            <div className="d-flex justify-content-between">
              <span className="fw-bold">Tổng cộng:</span>
              <strong className="text-primary" style={{ fontSize: '1.2rem' }}>
                ${pricingData.totalAmount?.toLocaleString()}
              </strong>
            </div>
          </div>
        ) : null}
      </div>

      {/* Continue Button */}
      <Button
        className="btn primary__btn w-100 mt-4"
        onClick={handleContinue}
        disabled={
          isTourExpired ||
          isTourOngoing ||
          availableSlots <= 0 ||
          pricingError ||
          isCalculatingPrice ||
          !pricingData
        }
      >
        {pricingError ? "Lỗi tính giá - Không thể tiếp tục" : "Tiếp tục →"}
      </Button>
    </div>
  );
};

export default Step1SelectOptions;
