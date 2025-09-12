import React, { useState, useEffect } from 'react';
import { Table, Badge, ListGroup, Card } from 'reactstrap';
import { Accordion } from 'react-bootstrap';
import axios from 'axios';
import { BASE_URL } from '../../utils/config.js';
import './pricing-details.css';
import './pricing-highlight.css';
import './enhanced-pricing.css';

const PricingDetails = ({ tourId, showHeader = true }) => {
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
        // Set empty array to prevent rendering errors
        setPricingRules([]);
      } finally {
        setLoading(false);
      }
    };

    if (tourId) {
      fetchPricingRules();
    }
  }, [tourId]);

  // Helper to get type label
  const getTypeLabel = (type) => {
    switch(type) {
      case 'ageBracket': return 'Phân loại theo độ tuổi';
      case 'seasonal': return 'Giá theo mùa';
      case 'promotion': return 'Khuyến mãi';
      case 'surcharge': return 'Phụ thu';
      default: return type;
    }
  };

  // Helper to get badge color
  const getBadgeColor = (type) => {
    switch(type) {
      case 'ageBracket': return 'primary';
      case 'seasonal': return 'success';
      case 'promotion': return 'info';
      case 'surcharge': return 'warning';
      default: return 'secondary';
    }
  };

  // Render table for age brackets
  const renderAgeBracketTable = (rule) => (
    <Table bordered size="sm" responsive className="mt-2 pricing-table">
      <thead>
        <tr>
          <th>Loại vé</th>
          <th>Độ tuổi</th>
          <th>Giảm giá</th>
        </tr>
      </thead>
      <tbody>
        {rule.ageBrackets?.map((bracket, idx) => (
          <tr key={idx} className={bracket.discountValue > 0 ? "pricing-rule-row" : ""}>
            <td>{bracket.name}</td>
            <td>
              {bracket.minAge !== undefined && bracket.maxAge !== undefined 
                ? `${bracket.minAge} - ${bracket.maxAge} tuổi`
                : bracket.minAge !== undefined 
                ? `≥ ${bracket.minAge} tuổi` 
                : bracket.maxAge !== undefined 
                ? `≤ ${bracket.maxAge} tuổi`
                : 'Tất cả độ tuổi'}
            </td>
            <td>
              {bracket.discountValue > 0 ? (
                <div className="price-badge discount">
                  <i className="ri-price-tag-3-line me-1"></i>
                  Giảm {bracket.discountValue} 
                  {bracket.discountType === 'percentage' ? '%' : ' VND'}
                </div>
              ) : (
                <div className="price-badge regular">Giá gốc</div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  // Render table for seasonal pricing
  const renderSeasonalTable = (rule) => (
    <Table bordered size="sm" responsive className="mt-2 pricing-table">
      <thead>
        <tr>
          <th>Tên mùa</th>
          <th>Thời gian</th>
          <th>Hệ số giá</th>
        </tr>
      </thead>
      <tbody>
        {rule.seasonalPricing?.map((season, idx) => (
          <tr key={idx} className={season.priceMultiplier !== 1 ? "pricing-rule-row" : ""}>
            <td>{season.name}</td>
            <td className="season-dates">
              <i className="ri-calendar-event-line me-1"></i>
              {new Date(season.startDate).toLocaleDateString('vi-VN')} - 
              {new Date(season.endDate).toLocaleDateString('vi-VN')}
            </td>
            <td>
              {season.priceMultiplier > 1 ? (
                <div className="price-badge surcharge">×{season.priceMultiplier}</div>
              ) : season.priceMultiplier < 1 ? (
                <div className="price-badge discount">×{season.priceMultiplier}</div>
              ) : (
                <div className="price-badge regular">×1 (Giá gốc)</div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  // Render promotion details
  const renderPromotionDetails = (rule) => {
    const promotion = rule.promotion;
    return (
      <div className="pricing-rule-highlight mt-3">
        <ListGroup flush className="mt-2">
          <ListGroup.Item className="d-flex justify-content-between align-items-center">
            <strong>Tên khuyến mãi:</strong> 
            <span className="promotion-name">{promotion.name}</span>
          </ListGroup.Item>
          {promotion.startDate && (
            <ListGroup.Item className="d-flex justify-content-between align-items-center">
              <strong>Thời gian:</strong>{' '}
              <div className="season-dates">
                <i className="ri-calendar-event-line me-1"></i>
                {new Date(promotion.startDate).toLocaleDateString('vi-VN')} 
                {promotion.endDate && ` - ${new Date(promotion.endDate).toLocaleDateString('vi-VN')}`}
              </div>
            </ListGroup.Item>
          )}
          {promotion.daysBeforeDeparture && (
            <ListGroup.Item className="d-flex justify-content-between align-items-center">
              <strong>Early Bird:</strong> 
              <span><i className="ri-time-line me-1"></i> Đặt trước {promotion.daysBeforeDeparture} ngày</span>
            </ListGroup.Item>
          )}
          {promotion.daysBeforeDepartureMax && (
            <ListGroup.Item className="d-flex justify-content-between align-items-center">
              <strong>Last Minute:</strong> 
              <span><i className="ri-time-line me-1"></i> Đặt trong vòng {promotion.daysBeforeDepartureMax} ngày</span>
            </ListGroup.Item>
          )}
          <ListGroup.Item className="d-flex justify-content-between align-items-center">
            <strong>Giảm giá:</strong>{' '}
            <div className="price-badge discount">
              <i className="ri-price-tag-3-line me-1"></i>
              {promotion.discountValue} 
              {promotion.discountType === 'percentage' ? '%' : ' VND'}
            </div>
          </ListGroup.Item>
        </ListGroup>
      </div>
    );
  };

  // Render surcharge details
  const renderSurchargeDetails = (rule) => {
    const surcharge = rule.surcharge;
    const surchargeTypeMap = {
      'singleRoom': 'Phòng đơn',
      'weekend': 'Cuối tuần',
      'holiday': 'Ngày lễ',
      'other': 'Khác'
    };
    
    const weekdayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    
    return (
      <div className="pricing-rule-highlight mt-3">
        <ListGroup flush className="mt-2">
          <ListGroup.Item className="d-flex justify-content-between align-items-center">
            <strong>Tên phụ thu:</strong> 
            <span className="surcharge-name">{surcharge.name}</span>
          </ListGroup.Item>
          <ListGroup.Item className="d-flex justify-content-between align-items-center">
            <strong>Loại phụ thu:</strong> 
            <span>
              <i className="ri-price-tag-3-line me-1"></i>
              {surchargeTypeMap[surcharge.applicableType] || surcharge.applicableType}
            </span>
          </ListGroup.Item>
          
          {surcharge.applicableType === 'weekend' && surcharge.daysOfWeek?.length > 0 && (
            <ListGroup.Item className="d-flex justify-content-between align-items-center">
              <strong>Áp dụng các ngày:</strong>{' '}
              <span>
                <i className="ri-calendar-event-line me-1"></i>
                {surcharge.daysOfWeek.map(day => weekdayNames[day]).join(', ')}
              </span>
            </ListGroup.Item>
          )}
          
          {surcharge.applicableType === 'holiday' && surcharge.dates?.length > 0 && (
            <ListGroup.Item className="d-flex justify-content-between align-items-center">
              <strong>Áp dụng các ngày lễ:</strong>{' '}
              <div className="season-dates">
                {surcharge.dates.map(date => 
                  new Date(date).toLocaleDateString('vi-VN')).join(', ')}
              </div>
            </ListGroup.Item>
          )}
          
          <ListGroup.Item className="d-flex justify-content-between align-items-center">
            <strong>Phụ thu:</strong>{' '}
            <div className="price-badge surcharge">
              <i className="ri-add-circle-line me-1"></i>
              {surcharge.chargeValue} 
              {surcharge.chargeType === 'percentage' ? '%' : ' VND'}
            </div>
          </ListGroup.Item>
        </ListGroup>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center my-3">
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        Đang tải thông tin giá vé...
      </div>
    );
  }

  if (error) {
    return <div className="text-danger my-3"><i className="ri-error-warning-line me-1"></i>{error}</div>;
  }

  if (!pricingRules || pricingRules.length === 0) {
    return null; // Không hiển thị gì nếu không có quy tắc giá
  }

  return (
    <div className="pricing-details">
      {/* Show heading based on showHeader prop */}
      {showHeader && (
        <h5 className="mb-4">Thông tin giá vé</h5>
      )}

      <Accordion className="pricing-rules-accordion">
        {pricingRules.map((rule, idx) => (
          <Accordion.Item key={rule._id} eventKey={idx.toString()} className={`pricing-card rule-type-${rule.type}`}>
            <Accordion.Header>
              <div className="d-flex align-items-center gap-2 w-100">
                <Badge color={getBadgeColor(rule.type)} className="pricing-badge">
                  {getTypeLabel(rule.type)}
                </Badge>
                <span className="pricing-rule-name">{rule.name}</span>
                <div className="rule-indicator ms-auto">
                  <i className={`ri-${rule.type === 'promotion' ? 'price-tag-3' : rule.type === 'surcharge' ? 'add-circle' : rule.type === 'seasonal' ? 'calendar-event' : 'user-settings'}-line`}></i>
                </div>
              </div>
            </Accordion.Header>
            <Accordion.Body>
              {rule.description && <p className="rule-description">{rule.description}</p>}
              
              {rule.type === 'ageBracket' && renderAgeBracketTable(rule)}
              {rule.type === 'seasonal' && renderSeasonalTable(rule)}
              {rule.type === 'promotion' && renderPromotionDetails(rule)}
              {rule.type === 'surcharge' && renderSurchargeDetails(rule)}
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
      
      {pricingRules.length > 0 && (
        <div className="pricing-callout mt-3">
          <i className="ri-information-line me-2"></i>
          Giá cuối cùng sẽ được tính dựa trên thông tin khách hàng, thời điểm đặt và các quy định giá hiện hành.
        </div>
      )}
    </div>
  );
};

export default PricingDetails;
