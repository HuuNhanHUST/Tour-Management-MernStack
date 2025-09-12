import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../utils/config.js';
import './thong-tin-gia-tour.css';

const ThongTinGiaTour = ({ tourId, basePrice = 0 }) => {
  const [pricingRules, setPricingRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPricingRules = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${BASE_URL}/pricing/tour/${tourId}`,
          { withCredentials: true }
        );
        setPricingRules(response.data.data || []);
      } catch (err) {
        console.error("Error fetching pricing rules:", err);
        setError("Không thể tải thông tin giá vé");
        setPricingRules([]);
      } finally {
        setLoading(false);
      }
    };

    if (tourId) {
      fetchPricingRules();
    }
  }, [tourId]);

  // Phân loại các loại quy tắc giá
  const ageBracketRule = pricingRules.find(rule => rule.type === 'ageBracket');
  const groupSizeRule = pricingRules.find(rule => rule.type === 'groupSize');
  const seasonalRules = pricingRules.filter(rule => rule.type === 'seasonal');
  const specialPromotions = pricingRules.filter(rule => rule.type === 'promotion' || rule.type === 'special');
  
  // Phân loại các loại giá theo độ tuổi
  const renderAgeBrackets = () => {
    if (!ageBracketRule || !ageBracketRule.ageBrackets || ageBracketRule.ageBrackets.length === 0) {
      return null;
    }
    
    return (
      <div className="age-brackets-pricing">
        {ageBracketRule.ageBrackets.map((bracket, idx) => {
          const isAdult = bracket.name?.toLowerCase().includes('lớn') || bracket.name?.toLowerCase().includes('adult');
          const isSenior = bracket.name?.toLowerCase().includes('cao tuổi') || bracket.name?.toLowerCase().includes('senior');
          const isChild = bracket.name?.toLowerCase().includes('trẻ em') || bracket.name?.toLowerCase().includes('child');
          
          let displayClass = isAdult ? "adult-bracket" : isSenior ? "senior-bracket" : isChild ? "child-bracket" : "";
          
          return (
            <div key={idx} className={`age-price-row ${displayClass}`}>
              <div className="age-price-info">
                <div className="age-type">{bracket.name}</div>
                <div className="age-range">
                  {bracket.minAge !== undefined && bracket.maxAge !== undefined 
                    ? `(${bracket.minAge} - ${bracket.maxAge} tuổi)`
                    : bracket.minAge !== undefined 
                    ? `(từ ${bracket.minAge} tuổi)` 
                    : bracket.maxAge !== undefined 
                    ? `(đến ${bracket.maxAge} tuổi)`
                    : '(Tất cả độ tuổi)'}
                </div>
              </div>
              <div className="age-price-value">
                {bracket.discountValue > 0 ? (
                  <div className="price-display">
                    <div className="discount-tag">
                      {bracket.discountType === 'percentage' ? `-${bracket.discountValue}%` : `-${bracket.discountValue.toLocaleString()} VND`}
                    </div>
                    <div className="calculated-price">
                      {basePrice > 0 && (
                        bracket.discountType === 'percentage' 
                        ? `${(basePrice * (1 - bracket.discountValue / 100)).toLocaleString()} VND`
                        : `${(basePrice - bracket.discountValue).toLocaleString()} VND`
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="price-display">
                    <div className="standard-tag">Giá gốc</div>
                    <div className="calculated-price">
                      {basePrice > 0 && `${basePrice.toLocaleString()} VND`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Hiển thị quy tắc giá theo nhóm
  const renderGroupSizes = () => {
    if (!groupSizeRule || !groupSizeRule.groupSizes || groupSizeRule.groupSizes.length === 0) {
      return null;
    }

    return (
      <div className="group-size-pricing">
        {groupSizeRule.groupSizes.map((group, idx) => {
          return (
            <div key={idx} className="group-price-row">
              <div className="group-price-info">
                <div className="group-size">
                  {group.minSize === group.maxSize 
                    ? `Nhóm ${group.minSize} người` 
                    : group.maxSize 
                      ? `Nhóm ${group.minSize} - ${group.maxSize} người`
                      : `Nhóm từ ${group.minSize} người`}
                </div>
              </div>
              <div className="group-price-value">
                {group.discountValue > 0 ? (
                  <div className="price-display">
                    <div className="discount-tag">
                      {group.discountType === 'percentage' ? `-${group.discountValue}%` : `-${group.discountValue.toLocaleString()} VND`}
                    </div>
                    <div className="calculated-price">
                      {basePrice > 0 && (
                        group.discountType === 'percentage' 
                        ? `${(basePrice * (1 - group.discountValue / 100)).toLocaleString()} VND`
                        : `${(basePrice - group.discountValue).toLocaleString()} VND`
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="price-display">
                    <div className="standard-tag">Giá gốc</div>
                    <div className="calculated-price">
                      {basePrice > 0 && `${basePrice.toLocaleString()} VND`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Hiển thị quy tắc giá theo mùa
  const renderSeasonalRules = () => {
    if (!seasonalRules || seasonalRules.length === 0) {
      return null;
    }

    return (
      <div className="seasonal-pricing">
        {seasonalRules.map((rule, idx) => {
          return (
            <div key={idx} className="seasonal-price-row">
              <div className="seasonal-price-info">
                <div className="season-name">{rule.name || 'Mùa cao điểm'}</div>
                {rule.startDate && rule.endDate && (
                  <div className="season-period">
                    {new Date(rule.startDate).toLocaleDateString('vi-VN')} - {new Date(rule.endDate).toLocaleDateString('vi-VN')}
                  </div>
                )}
              </div>
              <div className="seasonal-price-value">
                {rule.adjustmentValue > 0 ? (
                  <div className="price-display">
                    <div className="increase-tag">
                      {rule.adjustmentType === 'percentage' ? `+${rule.adjustmentValue}%` : `+${rule.adjustmentValue.toLocaleString()} VND`}
                    </div>
                    <div className="calculated-price increase-price">
                      {basePrice > 0 && (
                        rule.adjustmentType === 'percentage' 
                        ? `${(basePrice * (1 + rule.adjustmentValue / 100)).toLocaleString()} VND`
                        : `${(basePrice + rule.adjustmentValue).toLocaleString()} VND`
                      )}
                    </div>
                  </div>
                ) : rule.adjustmentValue < 0 ? (
                  <div className="price-display">
                    <div className="discount-tag">
                      {rule.adjustmentType === 'percentage' ? `-${Math.abs(rule.adjustmentValue)}%` : `-${Math.abs(rule.adjustmentValue).toLocaleString()} VND`}
                    </div>
                    <div className="calculated-price">
                      {basePrice > 0 && (
                        rule.adjustmentType === 'percentage' 
                        ? `${(basePrice * (1 + rule.adjustmentValue / 100)).toLocaleString()} VND`
                        : `${(basePrice + rule.adjustmentValue).toLocaleString()} VND`
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="price-display">
                    <div className="standard-tag">Giá gốc</div>
                    <div className="calculated-price">
                      {basePrice > 0 && `${basePrice.toLocaleString()} VND`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center my-2">
        <div className="spinner-border spinner-border-sm text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !pricingRules || pricingRules.length === 0) {
    return null;
  }

  // Xử lý khuyến mãi đặc biệt
  const renderSpecialPromotions = () => {
    if (!specialPromotions || specialPromotions.length === 0) {
      return null;
    }

    return (
      <div className="special-promotions">
        {specialPromotions.map((promo, idx) => {
          return (
            <div key={idx} className="promotion-price-row">
              <div className="promotion-price-info">
                <div className="promotion-name">{promo.name || 'Khuyến mãi đặc biệt'}</div>
                {promo.startDate && promo.endDate && (
                  <div className="promotion-period">
                    {new Date(promo.startDate).toLocaleDateString('vi-VN')} - {new Date(promo.endDate).toLocaleDateString('vi-VN')}
                  </div>
                )}
                {promo.description && (
                  <div className="promotion-desc">{promo.description}</div>
                )}
              </div>
              <div className="promotion-price-value">
                <div className="special-promo-tag">
                  {promo.discountValue ? 
                    (promo.discountType === 'percentage' ? `-${promo.discountValue}%` : `-${promo.discountValue.toLocaleString()} VND`) : 
                    'Khuyến mãi'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="tour-pricing-details">
      {/* Phân loại theo độ tuổi */}
      {ageBracketRule && (
        <div className="tour-pricing-section">
          <div className="tour-pricing-header">
            <i className="ri-user-settings-line pricing-icon"></i>
            <h5>Phân loại theo độ tuổi</h5>
          </div>
          {renderAgeBrackets()}
        </div>
      )}
      
      {/* Phân loại theo kích thước nhóm */}
      {groupSizeRule && (
        <div className="tour-pricing-section">
          <div className="tour-pricing-header">
            <i className="ri-team-line pricing-icon"></i>
            <h5>Giá theo số lượng người</h5>
          </div>
          {renderGroupSizes()}
        </div>
      )}
      
      {/* Phân loại theo mùa */}
      {seasonalRules.length > 0 && (
        <div className="tour-pricing-section">
          <div className="tour-pricing-header">
            <i className="ri-calendar-event-line pricing-icon"></i>
            <h5>Phụ thu theo mùa</h5>
          </div>
          {renderSeasonalRules()}
        </div>
      )}
      
      {/* Khuyến mãi đặc biệt */}
      {specialPromotions.length > 0 && (
        <div className="tour-pricing-section">
          <div className="tour-pricing-header">
            <i className="ri-coupon-line pricing-icon"></i>
            <h5>Khuyến mãi đặc biệt</h5>
          </div>
          {renderSpecialPromotions()}
        </div>
      )}
      
      <div className="pricing-note">
        <i className="ri-information-line"></i>
        <span>Giá có thể thay đổi theo thời điểm và các chương trình khuyến mãi</span>
      </div>
    </div>
  );
};

export default ThongTinGiaTour;
