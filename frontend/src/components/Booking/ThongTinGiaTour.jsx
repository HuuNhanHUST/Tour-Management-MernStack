import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../utils/config.js';
import './thong-tin-gia-tour.css';

const ThongTinGiaTour = ({ tourId, basePrice = 0 }) => {
  const [pricingRules, setPricingRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug basePrice
  console.log("ThongTinGiaTour received basePrice:", basePrice, typeof basePrice);
  
  // Normalize basePrice to handle different input types
  const normalizedBasePrice = typeof basePrice === 'string' 
    ? parseFloat(basePrice.replace(/[^0-9.-]/g, '')) || 0
    : Number(basePrice) || 0;

  useEffect(() => {
    const fetchPricingRules = async () => {
      setLoading(true);
      try {
        console.log("=== PRICING RULES DEBUG START ===");
        console.log("Fetching pricing rules for tourId:", tourId);
        
        const response = await axios.get(
          `${BASE_URL}/pricing/tour/${tourId}`,
          { withCredentials: true }
        );
        
        console.log("Full API Response:", response.data);
        console.log("Pricing rules data:", response.data.data);
        
        const rules = response.data.data || [];
        setPricingRules(rules);
        
        // Debug từng rule để hiểu cấu trúc
        rules.forEach((rule, index) => {
          console.log(`Rule ${index}:`, {
            name: rule.name,
            type: rule.type,
            category: rule.category,
            description: rule.description,
            fullRule: rule
          });
        });
        
        console.log("=== PRICING RULES DEBUG END ===");
        
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
  
  // Seasonal rules: chỉ lấy những rule có type = 'seasonal'
  const seasonalRules = pricingRules.filter(rule => rule.type === 'seasonal');
  
  // Surcharge rules: lấy những rule có type = 'surcharge'
  const surchargeRules = pricingRules.filter(rule => rule.type === 'surcharge');
  
  // Special promotions: chỉ lấy những rule có type = 'promotion'
  const specialPromotions = pricingRules.filter(rule => {
    return rule.type === 'promotion';
  });
  
  console.log("All pricing rules:", pricingRules);
  console.log("Age bracket rule:", ageBracketRule);
  console.log("Seasonal rules:", seasonalRules);
  console.log("Surcharge rules:", surchargeRules);
  console.log("Special promotions found:", specialPromotions);
  
  // Phân loại các loại giá theo độ tuổi
  const renderAgeBrackets = () => {
    if (!ageBracketRule || !ageBracketRule.ageBrackets || ageBracketRule.ageBrackets.length === 0) {
      return null;
    }
    
    console.log("Age bracket rule:", ageBracketRule);
    console.log("Base price:", basePrice);
    
    return (
      <div className="age-brackets-pricing">
        {ageBracketRule.ageBrackets.map((bracket, idx) => {
          const isAdult = bracket.name?.toLowerCase().includes('lớn') || bracket.name?.toLowerCase().includes('adult');
          const isSenior = bracket.name?.toLowerCase().includes('cao tuổi') || bracket.name?.toLowerCase().includes('senior');
          const isChild = bracket.name?.toLowerCase().includes('trẻ em') || bracket.name?.toLowerCase().includes('child');
          
          let displayClass = isAdult ? "adult-bracket" : isSenior ? "senior-bracket" : isChild ? "child-bracket" : "";
          
          console.log(`Bracket ${idx}:`, {
            name: bracket.name,
            discountValue: bracket.discountValue,
            discountType: bracket.discountType,
            isAdult, isSenior, isChild
          });
          
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
                      {normalizedBasePrice > 0 && (
                        bracket.discountType === 'percentage' 
                        ? `${Math.round(normalizedBasePrice * (1 - bracket.discountValue / 100)).toLocaleString()} VND`
                        : `${Math.round(normalizedBasePrice - bracket.discountValue).toLocaleString()} VND`
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="price-display">
                    <div className="standard-tag">Giá gốc</div>
                    <div className="calculated-price">
                      {normalizedBasePrice > 0 && `${Math.round(normalizedBasePrice).toLocaleString()} VND`}
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
                      {normalizedBasePrice > 0 && (
                        group.discountType === 'percentage' 
                        ? `${(normalizedBasePrice * (1 - group.discountValue / 100)).toLocaleString()} VND`
                        : `${(normalizedBasePrice - group.discountValue).toLocaleString()} VND`
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="price-display">
                    <div className="standard-tag">Giá gốc</div>
                    <div className="calculated-price">
                      {normalizedBasePrice > 0 && `${normalizedBasePrice.toLocaleString()} VND`}
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

  // Hiển thị quy tắc giá theo mùa và phụ thu
  const renderSeasonalRules = () => {
    const allSeasonalAndSurcharge = [...seasonalRules, ...surchargeRules];
    
    if (!allSeasonalAndSurcharge || allSeasonalAndSurcharge.length === 0) {
      return null;
    }

    return (
      <div className="seasonal-pricing">
        {allSeasonalAndSurcharge.map((rule, idx) => {
          // Xử lý seasonal rules
          if (rule.type === 'seasonal' && rule.seasonalPricing && rule.seasonalPricing.length > 0) {
            return rule.seasonalPricing.map((season, seasonIdx) => (
              <div key={`${idx}-${seasonIdx}`} className="seasonal-price-row">
                <div className="seasonal-price-info">
                  <div className="season-name">{season.name || rule.name || 'Mùa cao điểm'}</div>
                  {season.startDate && season.endDate && (
                    <div className="season-period">
                      {new Date(season.startDate).toLocaleDateString('vi-VN')} - {new Date(season.endDate).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                </div>
                <div className="seasonal-price-value">
                  {season.priceMultiplier > 1 ? (
                    <div className="price-display">
                      <div className="increase-tag">
                        +{((season.priceMultiplier - 1) * 100).toFixed(0)}%
                      </div>
                      <div className="calculated-price increase-price">
                        {normalizedBasePrice > 0 && `${(normalizedBasePrice * season.priceMultiplier).toLocaleString()} VND`}
                      </div>
                    </div>
                  ) : season.priceMultiplier < 1 ? (
                    <div className="price-display">
                      <div className="discount-tag">
                        -{((1 - season.priceMultiplier) * 100).toFixed(0)}%
                      </div>
                      <div className="calculated-price">
                        {normalizedBasePrice > 0 && `${(normalizedBasePrice * season.priceMultiplier).toLocaleString()} VND`}
                      </div>
                    </div>
                  ) : (
                    <div className="price-display">
                      <div className="standard-tag">Giá gốc</div>
                      <div className="calculated-price">
                        {normalizedBasePrice > 0 && `${normalizedBasePrice.toLocaleString()} VND`}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ));
          }
          
          // Xử lý surcharge rules
          if (rule.type === 'surcharge' && rule.surcharge) {
            const surcharge = rule.surcharge;
            return (
              <div key={idx} className="seasonal-price-row">
                <div className="seasonal-price-info">
                  <div className="season-name">{surcharge.name || rule.name || 'Phụ thu'}</div>
                  {rule.description && (
                    <div className="season-description">{rule.description}</div>
                  )}
                </div>
                <div className="seasonal-price-value">
                  {surcharge.chargeValue > 0 ? (
                    <div className="price-display">
                      <div className="increase-tag">
                        {surcharge.chargeType === 'percentage' ? `+${surcharge.chargeValue}%` : `+${surcharge.chargeValue.toLocaleString()} VND`}
                      </div>
                      <div className="calculated-price increase-price">
                        {normalizedBasePrice > 0 && (
                          surcharge.chargeType === 'percentage' 
                          ? `${(normalizedBasePrice * (1 + surcharge.chargeValue / 100)).toLocaleString()} VND`
                          : `${(normalizedBasePrice + surcharge.chargeValue).toLocaleString()} VND`
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="price-display">
                      <div className="standard-tag">Giá gốc</div>
                      <div className="calculated-price">
                        {normalizedBasePrice > 0 && `${normalizedBasePrice.toLocaleString()} VND`}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          }
          
          return null;
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
          const promotion = promo.promotion || {};
          return (
            <div key={idx} className="promotion-price-row">
              <div className="promotion-price-info">
                <div className="promotion-name">{promotion.name || promo.name || 'Khuyến mãi đặc biệt'}</div>
                {promotion.startDate && promotion.endDate && (
                  <div className="promotion-period">
                    {new Date(promotion.startDate).toLocaleDateString('vi-VN')} - {new Date(promotion.endDate).toLocaleDateString('vi-VN')}
                  </div>
                )}
                {promo.description && (
                  <div className="promotion-desc">{promo.description}</div>
                )}
                {promotion.daysBeforeDeparture && (
                  <div className="promotion-condition">
                    Đặt trước {promotion.daysBeforeDeparture} ngày
                  </div>
                )}
              </div>
              <div className="promotion-price-value">
                {promotion.discountValue > 0 ? (
                  <div className="price-display">
                    <div className="discount-tag">
                      {promotion.discountType === 'percentage' ? `-${promotion.discountValue}%` : `-${promotion.discountValue.toLocaleString()} VND`}
                    </div>
                    <div className="calculated-price">
                      {normalizedBasePrice > 0 && (
                        promotion.discountType === 'percentage' 
                        ? `${(normalizedBasePrice * (1 - promotion.discountValue / 100)).toLocaleString()} VND`
                        : `${(normalizedBasePrice - promotion.discountValue).toLocaleString()} VND`
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="special-promo-tag">
                    Khuyến mãi
                  </div>
                )}
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
      
      {/* Phân loại theo mùa và phụ thu */}
      {(seasonalRules.length > 0 || surchargeRules.length > 0) && (
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
