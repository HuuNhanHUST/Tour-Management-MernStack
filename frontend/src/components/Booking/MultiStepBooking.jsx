import React, { useState, useContext } from "react";
import "./booking.css";
import "./multi-step-booking.css";
import { AuthContext } from "../../context/AuthContext";
import Step1SelectOptions from "./Step1SelectOptions";
import Step2GuestInfo from "./Step2GuestInfo";
import Step3Payment from "./Step3Payment";

const MultiStepBooking = ({ tour, avgRating }) => {
  const { user } = useContext(AuthContext);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Shared state across all steps
  const [bookingData, setBookingData] = useState({
    // Step 1: Tour options
    guestSize: 1,
    singleRoomCount: 0,
    guests: [{ fullName: "", age: 30, guestType: "adult" }],
    
    // Step 2: Contact & Guest details
    fullName: "",
    phone: "",
    province: { code: "", name: "" },
    district: { code: "", name: "" },
    ward: { code: "", name: "" },
    addressDetail: "",
    
    // Step 3: Pricing data from API
    pricingData: null,
    isCalculatingPrice: false,
    pricingError: false,
    
    // User info from context
    userId: user?._id || "",
    userEmail: user?.email || "",
  });

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      // Scroll to top when changing steps
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const updateBookingData = (newData) => {
    setBookingData(prev => ({ ...prev, ...newData }));
  };

  // Progress indicator
  const renderProgressBar = () => {
    const steps = [
      { num: 1, label: "Chọn tùy chọn" },
      { num: 2, label: "Thông tin khách" },
      { num: 3, label: "Thanh toán" }
    ];

    return (
      <div className="booking-progress-bar">
        {steps.map((step, index) => (
          <React.Fragment key={step.num}>
            <div className={`progress-step ${currentStep >= step.num ? 'active' : ''} ${currentStep === step.num ? 'current' : ''}`}>
              <div className="progress-step-circle">
                {currentStep > step.num ? (
                  <i className="ri-check-line"></i>
                ) : (
                  step.num
                )}
              </div>
              <div className="progress-step-label">{step.label}</div>
            </div>
            {index < steps.length - 1 && (
              <div className={`progress-line ${currentStep > step.num ? 'active' : ''}`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="booking multi-step-booking">
      <div className="booking__top d-flex align-items-center justify-content-between">
        <div>
          <h3>
            ${tour.price}
            <span>/ giá cơ bản</span>
          </h3>
          <h4>{tour.title}</h4>
          <small className="text-muted">* Giá có thể thay đổi theo tuổi, thời điểm đặt, và các yêu cầu đặc biệt</small>
        </div>
        <span className="tour__rating d-flex align-items-center">
          <i className="ri-star-line"></i>
          {avgRating === 0 ? "Chưa có đánh giá nào" : avgRating} ({tour.reviews?.length || 0})
        </span>
      </div>

      {/* Progress Bar */}
      {renderProgressBar()}

      {/* Step Content */}
      <div className="booking__form">
        {currentStep === 1 && (
          <Step1SelectOptions
            tour={tour}
            bookingData={bookingData}
            updateBookingData={updateBookingData}
            nextStep={nextStep}
          />
        )}

        {currentStep === 2 && (
          <Step2GuestInfo
            tour={tour}
            bookingData={bookingData}
            updateBookingData={updateBookingData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}

        {currentStep === 3 && (
          <Step3Payment
            tour={tour}
            bookingData={bookingData}
            updateBookingData={updateBookingData}
            prevStep={prevStep}
          />
        )}
      </div>
    </div>
  );
};

export default MultiStepBooking;
