import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../utils/config.js';
import './thong-tin-gia.css';

const ThongTinGia = ({ tourId }) => {
  const [pricingRules, setPricingRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

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

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  // Render phần phân loại theo độ tuổi
  const renderAgeBrackets = (rule) => {
    if (!rule.ageBrackets || rule.ageBrackets.length === 0) return null;
    
    return (
      <div className="phan-loai-tuoi">
        {rule.ageBrackets.map((bracket, index) => (
          <div key={index} className="bracket-row">
            <div>
              <div className="bracket-type">{bracket.name}</div>
              <div className="bracket-age">
                {bracket.minAge !== undefined && bracket.maxAge !== undefined 
                  ? `${bracket.minAge} - ${bracket.maxAge} tuổi`
                  : bracket.minAge !== undefined 
                  ? `≥ ${bracket.minAge} tuổi` 
                  : bracket.maxAge !== undefined 
                  ? `≤ ${bracket.maxAge} tuổi`
                  : 'Tất cả độ tuổi'}
              </div>
            </div>
            <div className="bracket-discount">
              {bracket.discountValue > 0 ? (
                `Giảm ${bracket.discountValue}${bracket.discountType === 'percentage' ? '%' : ' VND'}`
              ) : (
                'Giá gốc'
              )}
            </div>
          </div>
        ))}
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

  if (error) {
    return null;
  }

  if (!pricingRules || pricingRules.length === 0) {
    return null;
  }

  // Lọc ra quy tắc phân loại theo độ tuổi
  const ageBracketRule = pricingRules.find(rule => rule.type === 'ageBracket');

  return (
    <div className="thong-tin-gia-accordion">
      <div className={`thong-tin-gia-header ${expanded ? '' : 'collapsed'}`} onClick={toggleExpand}>
        <h5>
          <i className="ri-price-tag-3-line thong-tin-gia-icon"></i>
          Thông tin giá vé
        </h5>
        <i className={`ri-arrow-right-s-line expand-icon`}></i>
      </div>
      
      {expanded && (
        <div className="thong-tin-gia-content">
          {ageBracketRule && (
            <div className="thong-tin-gia-item">
              <div className="thong-tin-gia-item-title">
                <i className="ri-user-settings-line"></i>
                Phân loại theo độ tuổi
              </div>
              {renderAgeBrackets(ageBracketRule)}
            </div>
          )}
          
          {/* Các nội dung khác có thể được thêm vào đây */}
          <div className="thong-tin-gia-note mt-2">
            <small className="text-muted d-flex align-items-center">
              <i className="ri-information-line me-1"></i>
              Giá có thể thay đổi theo thời điểm đặt và các chương trình khuyến mãi
            </small>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThongTinGia;
