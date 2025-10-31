import React, { useState, useCallback } from "react";
import { Button, FormGroup } from "reactstrap";
import LocationSelect from "../Location/LocationSelect";
import NotificationManager from "../shared/NotificationManager";

const Step2GuestInfo = ({ tour, bookingData, updateBookingData, nextStep, prevStep }) => {
  const [fullName, setFullName] = useState(bookingData.fullName);
  const [phone, setPhone] = useState(bookingData.phone);
  const [location, setLocation] = useState({
    province: bookingData.province,
    district: bookingData.district,
    ward: bookingData.ward,
  });
  const [addressDetail, setAddressDetail] = useState(bookingData.addressDetail);
  
  const [localGuests, setLocalGuests] = useState(bookingData.guests.map(g => ({
    ...g,
    fullName: g.fullName || ""
  })));

  const handleLocationChange = useCallback((loc) => {
    setLocation(loc);
  }, []);

  const updateGuest = (index, field, value) => {
    const newGuests = [...localGuests];
    newGuests[index][field] = value;
    setLocalGuests(newGuests);
  };

  const handleContinue = () => {
    // Validation
    if (!fullName.trim()) {
      NotificationManager.error("Vui lòng nhập họ tên người đặt tour");
      return;
    }

    if (!phone.trim()) {
      NotificationManager.error("Vui lòng nhập số điện thoại");
      return;
    }

    // Validate phone format (basic)
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      NotificationManager.error("Số điện thoại không hợp lệ (10-11 chữ số)");
      return;
    }

    // Check all guests have names
    const hasEmptyName = localGuests.some(g => !g.fullName.trim());
    if (hasEmptyName) {
      NotificationManager.error("Vui lòng nhập đầy đủ họ tên cho tất cả khách");
      return;
    }

    // Validate address
    if (!location.province.code || !location.district.code || !location.ward.code) {
      NotificationManager.error("Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã");
      return;
    }

    if (!addressDetail.trim()) {
      NotificationManager.error("Vui lòng nhập địa chỉ chi tiết (số nhà, đường)");
      return;
    }

    // Update parent state
    updateBookingData({
      fullName: fullName.trim(),
      phone: phone.trim(),
      province: location.province,
      district: location.district,
      ward: location.ward,
      addressDetail: addressDetail.trim(),
      guests: localGuests.map(g => ({
        ...g,
        fullName: g.fullName.trim()
      })),
    });

    nextStep();
  };

  return (
    <div className="step-container">
      <div className="booking-section-title border-bottom pb-2 mb-3">
        <h5 className="fw-bold">Bước 2: Thông tin đặt tour</h5>
        <small className="text-muted">
          Vui lòng điền đầy đủ thông tin để chúng tôi liên hệ và sắp xếp tour tốt nhất cho bạn
        </small>
      </div>

      {/* Contact Info */}
      <div className="booking-section mb-4">
        <div className="booking-section-header">
          <i className="ri-user-line section-icon"></i>
          <h6 className="fw-bold">Thông tin người đặt tour</h6>
        </div>
        <FormGroup>
          <label htmlFor="fullName">Họ và tên <span className="text-danger">*</span></label>
          <input
            type="text"
            id="fullName"
            className="form-control"
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </FormGroup>
        <FormGroup>
          <label htmlFor="phone">Số điện thoại <span className="text-danger">*</span></label>
          <input
            type="tel"
            id="phone"
            className="form-control"
            placeholder="0901234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <small className="text-muted">Chúng tôi sẽ liên hệ qua số này để xác nhận tour</small>
        </FormGroup>
      </div>

      {/* Guest Details */}
      <div className="booking-section mb-4">
        <div className="booking-section-header">
          <i className="ri-team-line section-icon"></i>
          <h6 className="fw-bold">Chi tiết thông tin khách đi tour</h6>
        </div>
        <p className="text-muted mb-3">
          <i className="ri-information-line"></i> Tuổi và loại khách đã được chọn ở bước trước
        </p>

        {localGuests.map((guest, index) => (
          <div key={index} className="guest-detail-card border p-3 mb-3 rounded">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">
                Khách {index + 1}
                <span className="badge bg-info ms-2">
                  {guest.age} tuổi - {guest.guestType === 'adult' ? 'Người lớn' :
                    guest.guestType === 'child' ? 'Trẻ em' :
                    guest.guestType === 'infant' ? 'Em bé' :
                    guest.guestType === 'senior' ? 'Người cao tuổi' : 'Sinh viên'}
                </span>
              </h6>
            </div>

            <FormGroup>
              <label>Họ và tên <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="Nhập họ tên đầy đủ"
                value={guest.fullName}
                onChange={e => updateGuest(index, 'fullName', e.target.value)}
                required
              />
            </FormGroup>
          </div>
        ))}
      </div>

      {/* Pickup Address */}
      <div className="booking-section mb-4">
        <div className="booking-section-header">
          <i className="ri-map-pin-line section-icon"></i>
          <h6 className="fw-bold">Địa chỉ đón khách</h6>
        </div>
        <FormGroup>
          <label>Tỉnh/Thành, Quận/Huyện, Phường/Xã <span className="text-danger">*</span></label>
          <LocationSelect onChange={handleLocationChange} />
          <small className="text-muted">Chọn địa chỉ để chúng tôi sắp xếp xe đón</small>
        </FormGroup>

        <FormGroup>
          <label htmlFor="addressDetail">Số nhà, đường, thôn xóm <span className="text-danger">*</span></label>
          <input
            type="text"
            id="addressDetail"
            className="form-control"
            placeholder="Ví dụ: 123 Nguyễn Huệ, Phường Bến Nghé"
            value={addressDetail}
            onChange={(e) => setAddressDetail(e.target.value)}
            required
          />
        </FormGroup>
      </div>

      {/* Summary */}
      <div className="booking-section mb-4">
        <div className="booking-section-header">
          <i className="ri-file-list-3-line section-icon"></i>
          <h6 className="fw-bold">Tóm tắt đặt tour</h6>
        </div>
        <div className="summary-card p-3 bg-light rounded">
          <div className="d-flex justify-content-between mb-2">
            <span>Tour:</span>
            <strong>{tour.title}</strong>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span>Số khách:</span>
            <strong>{bookingData.guestSize} người</strong>
          </div>
          {bookingData.singleRoomCount > 0 && (
            <div className="d-flex justify-content-between mb-2">
              <span>Phòng đơn:</span>
              <strong>{bookingData.singleRoomCount} phòng</strong>
            </div>
          )}
          <hr />
          <div className="d-flex justify-content-between">
            <span className="fw-bold">Tổng tiền:</span>
            <strong className="text-primary" style={{ fontSize: '1.2rem' }}>
              ${bookingData.pricingData?.totalAmount?.toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="d-flex gap-2">
        <Button
          className="btn btn-outline-secondary"
          onClick={prevStep}
          style={{ flex: 1 }}
        >
          ← Quay lại
        </Button>
        <Button
          className="btn primary__btn"
          onClick={handleContinue}
          style={{ flex: 2 }}
        >
          Tiếp tục thanh toán →
        </Button>
      </div>
    </div>
  );
};

export default Step2GuestInfo;
