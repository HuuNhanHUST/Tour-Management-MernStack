import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Modal, Alert, Tabs, Tab, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';
import { BASE_URL } from '../../../utils/config.js';
import './PricingManager.css';

const PricingManager = () => {
  // We don't need the user context for this component as we're using cookie auth
  const [tours, setTours] = useState([]);
  const [pricingRules, setPricingRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentRule, setCurrentRule] = useState(null);
  const [selectedTourId, setSelectedTourId] = useState('');
  const [error, setError] = useState('');
  const [ruleType, setRuleType] = useState('ageBracket');

  // Form states for different rule types
  const [ageBracketForm, setAgeBracketForm] = useState({
    name: '',
    description: '',
    ageBrackets: [
      {
        name: 'Adult',
        minAge: 18,
        maxAge: 65,
        discountType: 'percentage',
        discountValue: 0,
        requiredId: false
      }
    ]
  });

  const [seasonalForm, setSeasonalForm] = useState({
    name: '',
    description: '',
    seasonalPricing: [
      {
        name: 'High Season',
        startDate: new Date().toISOString().split('T')[0],  // Today's date as default
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],  // 3 months later as default
        priceMultiplier: 1
      }
    ]
  });

  const [promotionForm, setPromotionForm] = useState({
    name: '',
    description: '',
    promotion: {
      name: 'Early Bird',
      startDate: new Date().toISOString().split('T')[0],  // Today's date
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],  // Next year
      daysBeforeDeparture: 30,
      daysBeforeDepartureMax: null,
      discountType: 'percentage',
      discountValue: 10
    }
  });

  const [surchargeForm, setSurchargeForm] = useState({
    name: '',
    description: '',
    surcharge: {
      name: 'Single Room',
      applicableType: 'singleRoom',
      dates: [],
      daysOfWeek: [],
      chargeType: 'percentage',
      chargeValue: 15
    }
  });

  // Fetch tours and pricing rules
  const fetchPricingRules = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/pricing`, {
        withCredentials: true
      });
      console.log("Fetched pricing rules:", response.data.data);
      setPricingRules(response.data.data || []);
    } catch (err) {
      console.error("Error fetching pricing rules:", err);
      setError("Không thể tải quy tắc giá. Vui lòng thử lại sau.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch tours
        const toursRes = await axios.get(`${BASE_URL}/tour/all`, {
          withCredentials: true
        });
        
        // Sort tours by name for easier selection
        const sortedTours = toursRes.data.data.sort((a, b) => {
          return (a.title || '').localeCompare(b.title || '');
        });
        
        console.log("Loaded tours for pricing:", sortedTours);
        setTours(sortedTours);
        
        // Fetch pricing rules separately
        await fetchPricingRules();
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleShowModal = (mode, rule = null) => {
    setModalMode(mode);
    console.log("Opening modal in mode:", mode, rule);
    
    if (rule) {
      setCurrentRule(rule);
      setSelectedTourId(rule.tourId);
      setRuleType(rule.type);
      console.log("Setting rule type:", rule.type);
      
      // Set form data based on rule type
      switch(rule.type) {
        case 'ageBracket':
          setAgeBracketForm({
            name: rule.name,
            description: rule.description || '',
            ageBrackets: rule.ageBrackets || []
          });
          break;
        case 'seasonal':
          setSeasonalForm({
            name: rule.name,
            description: rule.description || '',
            seasonalPricing: rule.seasonalPricing || []
          });
          break;
        case 'promotion':
          setPromotionForm({
            name: rule.name,
            description: rule.description || '',
            promotion: rule.promotion || {}
          });
          break;
        case 'surcharge':
          setSurchargeForm({
            name: rule.name,
            description: rule.description || '',
            surcharge: rule.surcharge || {}
          });
          break;
        default:
          break;
      }
    } else {
      setCurrentRule(null);
      resetForms();
    }
    
    setShowModal(true);
  };

  const resetForms = () => {
    setAgeBracketForm({
      name: '',
      description: '',
      ageBrackets: [
        {
          name: 'Adult',
          minAge: 18,
          maxAge: 65,
          discountType: 'percentage',
          discountValue: 0,
          requiredId: false
        }
      ]
    });
    
    setSeasonalForm({
      name: '',
      description: '',
      seasonalPricing: [
        {
          name: 'High Season',
          startDate: new Date().toISOString().split('T')[0],  // Today's date as default
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],  // 3 months later as default
          priceMultiplier: 1
        }
      ]
    });
    
    setPromotionForm({
      name: '',
      description: '',
      promotion: {
        name: 'Early Bird',
        startDate: new Date().toISOString().split('T')[0],  // Today's date
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],  // Next year
        daysBeforeDeparture: 30,
        daysBeforeDepartureMax: null,
        discountType: 'percentage',
        discountValue: 10
      }
    });
    
    setSurchargeForm({
      name: '',
      description: '',
      surcharge: {
        name: 'Single Room',
        applicableType: 'singleRoom',
        dates: [],
        daysOfWeek: [],
        chargeType: 'percentage',
        chargeValue: 15
      }
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForms();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted");
    
    // Ngăn chặn việc submit form mặc định của browser
    e.stopPropagation();
    
    if (!selectedTourId) {
      setError("Vui lòng chọn tour");
      return;
    }
    
    // Validate based on rule type
    let isValid = true;
    let errorMessage = "";
    
    // Log form data for debugging
    console.log("Current form data:", {
      ruleType,
      selectedTourId,
      ageBracketForm,
      seasonalForm,
      promotionForm,
      surchargeForm
    });
    
    // Check active tab
    console.log("Current rule type:", ruleType);
    
    // Xử lý khi chế độ edit: cần thêm _id vào formData
    if (modalMode === 'edit' && currentRule && currentRule._id) {
      console.log("Editing existing rule with ID:", currentRule._id);
    }
    
    switch(ruleType) {
      case 'ageBracket':
        if (!ageBracketForm.name) {
          isValid = false;
          errorMessage = "Vui lòng nhập tên quy tắc";
        } else {
          // Check each bracket
          ageBracketForm.ageBrackets.forEach((bracket, index) => {
            if (!bracket.name) {
              isValid = false;
              errorMessage = `Vui lòng nhập tên loại vé thứ ${index + 1}`;
            }
          });
        }
        break;
      case 'seasonal':
        if (!seasonalForm.name) {
          isValid = false;
          errorMessage = "Vui lòng nhập tên quy tắc";
        } else {
          // Check each season
          seasonalForm.seasonalPricing.forEach((season, index) => {
            if (!season.name) {
              isValid = false;
              errorMessage = `Vui lòng nhập tên mùa thứ ${index + 1}`;
            }
            if (!season.startDate) {
              isValid = false;
              errorMessage = `Vui lòng chọn ngày bắt đầu cho mùa thứ ${index + 1}`;
            }
            if (!season.endDate) {
              isValid = false;
              errorMessage = `Vui lòng chọn ngày kết thúc cho mùa thứ ${index + 1}`;
            }
          });
        }
        break;
      case 'promotion':
        if (!promotionForm.name) {
          isValid = false;
          errorMessage = "Vui lòng nhập tên quy tắc";
        } else if (!promotionForm.promotion.name) {
          isValid = false;
          errorMessage = "Vui lòng nhập tên khuyến mãi";
        }
        break;
      case 'surcharge':
        if (!surchargeForm.name) {
          isValid = false;
          errorMessage = "Vui lòng nhập tên quy tắc";
        } else if (!surchargeForm.surcharge.name) {
          isValid = false;
          errorMessage = "Vui lòng nhập tên phụ thu";
        }
        break;
      default:
        break;
    }
    
    if (!isValid) {
      setError(errorMessage);
      return;
    }
    
    setLoading(true);
    
    // Prepare data based on rule type
    let formData;
    
    console.log("Preparing form data for rule type:", ruleType);
    
    switch(ruleType) {
      case 'ageBracket':
        formData = {
          ...ageBracketForm,
          tourId: selectedTourId,
          type: ruleType
        };
        console.log("Using ageBracketForm:", ageBracketForm);
        break;
      case 'seasonal':
        formData = {
          ...seasonalForm,
          tourId: selectedTourId,
          type: ruleType
        };
        console.log("Using seasonalForm:", seasonalForm);
        break;
      case 'promotion':
        formData = {
          ...promotionForm,
          tourId: selectedTourId,
          type: ruleType
        };
        console.log("Using promotionForm:", promotionForm);
        break;
      case 'surcharge':
        formData = {
          ...surchargeForm,
          tourId: selectedTourId,
          type: ruleType
        };
        console.log("Using surchargeForm:", surchargeForm);
        break;
      default:
        setError("Loại quy tắc giá không hợp lệ");
        setLoading(false);
        return;
    }
    
    try {
      // Log data before sending
      console.log("Sending data:", formData);
      
      if (modalMode === 'create') {
        await axios.post(
          `${BASE_URL}/pricing`,
          formData,
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Instead of just adding to the array, fetch all rules again to ensure data consistency
        await fetchPricingRules();
        toast.success("Đã tạo quy tắc giá mới thành công!");
      } else {
        await axios.put(
          `${BASE_URL}/pricing/${currentRule._id}`,
          formData,
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Refresh all pricing rules
        await fetchPricingRules();
        toast.success("Cập nhật quy tắc giá thành công!");
      }
      
      handleCloseModal();
    } catch (err) {
      console.error("Error submitting form:", err);
      console.log("Error details:", err.response?.data);
      console.log("Error status:", err.response?.status);
      setError(err.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa quy tắc giá này?")) {
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.delete(`${BASE_URL}/pricing/${ruleId}`, {
        withCredentials: true
      });
      
      // Refresh all pricing rules instead of just filtering the array
      await fetchPricingRules();
      toast.success("Đã xóa quy tắc giá thành công!");
    } catch (err) {
      console.error("Error deleting rule:", err);
      setError(err.response?.data?.message || "Không thể xóa quy tắc giá. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to add bracket
  const addBracket = () => {
    setAgeBracketForm({
      ...ageBracketForm,
      ageBrackets: [...ageBracketForm.ageBrackets, {
        name: '',
        minAge: null,
        maxAge: null,
        discountType: 'percentage',
        discountValue: 0,
        requiredId: false
      }]
    });
  };

  // Helper function to remove bracket
  const removeBracket = (index) => {
    const newBrackets = [...ageBracketForm.ageBrackets];
    newBrackets.splice(index, 1);
    setAgeBracketForm({...ageBracketForm, ageBrackets: newBrackets});
  };

  // Helper function to add season
  const addSeason = () => {
    setSeasonalForm({
      ...seasonalForm,
      seasonalPricing: [...seasonalForm.seasonalPricing, {
        name: `Mùa ${seasonalForm.seasonalPricing.length + 1}`,
        startDate: new Date().toISOString().split('T')[0],  // Today's date as default
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],  // 3 months later as default
        priceMultiplier: 1
      }]
    });
  };

  // Helper function to remove season
  const removeSeason = (index) => {
    const newSeasons = [...seasonalForm.seasonalPricing];
    newSeasons.splice(index, 1);
    setSeasonalForm({...seasonalForm, seasonalPricing: newSeasons});
  };

  // Helper function to update bracket
  const updateBracket = (index, field, value) => {
    const newBrackets = [...ageBracketForm.ageBrackets];
    newBrackets[index][field] = value;
    setAgeBracketForm({...ageBracketForm, ageBrackets: newBrackets});
  };

  // Helper function to update season
  const updateSeason = (index, field, value) => {
    const newSeasons = [...seasonalForm.seasonalPricing];
    newSeasons[index][field] = value;
    setSeasonalForm({...seasonalForm, seasonalPricing: newSeasons});
  };

  // Helper function to update promotion
  const updatePromotion = (field, value) => {
    setPromotionForm({
      ...promotionForm,
      promotion: {
        ...promotionForm.promotion,
        [field]: value
      }
    });
  };

  // Helper function to update surcharge
  const updateSurcharge = (field, value) => {
    setSurchargeForm({
      ...surchargeForm,
      surcharge: {
        ...surchargeForm.surcharge,
        [field]: value
      }
    });
  };

  // Helper function to update weekend days
  const toggleWeekendDay = (day) => {
    const currentDays = [...surchargeForm.surcharge.daysOfWeek];
    const index = currentDays.indexOf(day);
    
    if (index > -1) {
      currentDays.splice(index, 1);
    } else {
      currentDays.push(day);
    }
    
    updateSurcharge('daysOfWeek', currentDays);
  };

  // Helper to get tour name by ID
  const getTourNameById = (id) => {
    const tour = tours.find(t => t._id === id);
    if (!tour) return 'Unknown Tour';
    
    // Ensure the title is properly displayed
    return tour.title ? String(tour.title).trim() : 'Unnamed Tour';
  };

  // Render table for age brackets
  const renderAgeBracketTable = (rule) => (
    <Table striped bordered hover size="sm" className="mt-2">
      <thead>
        <tr>
          <th>Loại vé</th>
          <th>Độ tuổi từ</th>
          <th>Độ tuổi đến</th>
          <th>Giảm giá</th>
          <th>Yêu cầu ID</th>
        </tr>
      </thead>
      <tbody>
        {rule.ageBrackets?.map((bracket, idx) => (
          <tr key={idx}>
            <td>{bracket.name}</td>
            <td>{bracket.minAge !== undefined ? bracket.minAge : 'N/A'}</td>
            <td>{bracket.maxAge !== undefined ? bracket.maxAge : 'N/A'}</td>
            <td>
              {bracket.discountValue} 
              {bracket.discountType === 'percentage' ? '%' : ' VND'}
            </td>
            <td>{bracket.requiredId ? 'Có' : 'Không'}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  // Render table for seasonal pricing
  const renderSeasonalTable = (rule) => (
    <Table striped bordered hover size="sm" className="mt-2">
      <thead>
        <tr>
          <th>Tên mùa</th>
          <th>Ngày bắt đầu</th>
          <th>Ngày kết thúc</th>
          <th>Hệ số giá</th>
        </tr>
      </thead>
      <tbody>
        {rule.seasonalPricing?.map((season, idx) => (
          <tr key={idx}>
            <td>{season.name}</td>
            <td>{new Date(season.startDate).toLocaleDateString('vi-VN')}</td>
            <td>{new Date(season.endDate).toLocaleDateString('vi-VN')}</td>
            <td>×{season.priceMultiplier}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  // Render promotion details
  const renderPromotionDetails = (rule) => {
    const promotion = rule.promotion;
    return (
      <div className="mt-2">
        <p><strong>Tên khuyến mãi:</strong> {promotion.name}</p>
        {promotion.startDate && <p><strong>Ngày bắt đầu:</strong> {new Date(promotion.startDate).toLocaleDateString('vi-VN')}</p>}
        {promotion.endDate && <p><strong>Ngày kết thúc:</strong> {new Date(promotion.endDate).toLocaleDateString('vi-VN')}</p>}
        {promotion.daysBeforeDeparture && <p><strong>Early Bird (ngày trước khởi hành):</strong> {promotion.daysBeforeDeparture}</p>}
        {promotion.daysBeforeDepartureMax && <p><strong>Last Minute (tối đa ngày trước khởi hành):</strong> {promotion.daysBeforeDepartureMax}</p>}
        <p>
          <strong>Giảm giá:</strong> {promotion.discountValue} 
          {promotion.discountType === 'percentage' ? '%' : ' VND'}
        </p>
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
      <div className="mt-2">
        <p><strong>Tên phụ thu:</strong> {surcharge.name}</p>
        <p><strong>Loại phụ thu:</strong> {surchargeTypeMap[surcharge.applicableType] || surcharge.applicableType}</p>
        
        {surcharge.applicableType === 'weekend' && surcharge.daysOfWeek?.length > 0 && (
          <p>
            <strong>Ngày trong tuần:</strong>{' '}
            {surcharge.daysOfWeek.map(day => weekdayNames[day]).join(', ')}
          </p>
        )}
        
        {surcharge.applicableType === 'holiday' && surcharge.dates?.length > 0 && (
          <p>
            <strong>Ngày lễ:</strong>{' '}
            {surcharge.dates.map(date => new Date(date).toLocaleDateString('vi-VN')).join(', ')}
          </p>
        )}
        
        <p>
          <strong>Phụ thu:</strong> {surcharge.chargeValue} 
          {surcharge.chargeType === 'percentage' ? '%' : ' VND'}
        </p>
      </div>
    );
  };

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

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2 className="mb-4">Quản lý giá động</h2>
          
          {error && (
            <Alert variant="danger" onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          )}
          
          <Card className="shadow-sm pricing-manager-card">
            <Card.Header className="d-flex justify-content-between align-items-center bg-gradient-green">
              <h5 className="mb-0 text-white">Danh sách quy tắc giá</h5>
              <Button 
                variant="light" 
                onClick={() => handleShowModal('create')}
                disabled={loading}
                className="d-flex align-items-center"
              >
                <i className="ri-add-line me-1"></i> Thêm quy tắc giá
              </Button>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" role="status" variant="success">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                </div>
              ) : pricingRules.length === 0 ? (
                <div className="text-center py-5 empty-state">
                  <i className="ri-price-tag-3-line display-4 text-muted mb-3"></i>
                  <p className="lead">Chưa có quy tắc giá nào</p>
                  <Button 
                    variant="outline-success"
                    onClick={() => handleShowModal('create')}
                  >
                    <i className="ri-add-line me-1"></i> Tạo quy tắc giá đầu tiên
                  </Button>
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted">Tổng số: {pricingRules.length} quy tắc</span>
                    <div className="d-flex">
                      <Form.Control 
                        type="search" 
                        name="pricingSearch"
                        placeholder="Tìm quy tắc giá..." 
                        className="me-2" 
                        style={{maxWidth: '200px'}}
                      />
                    </div>
                  </div>
                  <div className="table-responsive pricing-table">
                    <Table striped bordered hover responsive className="align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Tour</th>
                          <th>Tên quy tắc</th>
                          <th>Loại</th>
                          <th>Chi tiết</th>
                          <th>Trạng thái</th>
                          <th style={{width: "150px"}}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricingRules.map(rule => (
                          <tr key={rule._id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <span className="ms-2">{getTourNameById(rule.tourId)}</span>
                              </div>
                            </td>
                            <td>
                              <strong>{rule.name}</strong>
                              {rule.description && (
                                <p className="text-muted small mb-0">{rule.description}</p>
                              )}
                            </td>
                            <td>
                              <Badge bg={getBadgeColor(rule.type)} className="rounded-pill px-3 py-2">
                                {getTypeLabel(rule.type)}
                              </Badge>
                            </td>
                            <td>
                              <div className="rule-details">
                                {rule.type === 'ageBracket' && renderAgeBracketTable(rule)}
                                {rule.type === 'seasonal' && renderSeasonalTable(rule)}
                                {rule.type === 'promotion' && renderPromotionDetails(rule)}
                                {rule.type === 'surcharge' && renderSurchargeDetails(rule)}
                              </div>
                            </td>
                            <td>
                              <Badge bg={rule.isActive ? 'success' : 'secondary'} className="rounded-pill px-3 py-2">
                                {rule.isActive ? 'Đang áp dụng' : 'Không áp dụng'}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm" 
                                  className="d-flex align-items-center"
                                  onClick={() => handleShowModal('edit', rule)}
                                >
                                  <i className="ri-edit-line me-1"></i> Sửa
                                </Button>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  className="d-flex align-items-center"
                                  onClick={() => handleDeleteRule(rule._id)}
                                >
                                  <i className="ri-delete-bin-line me-1"></i> Xóa
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" className="pricing-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? (
              <><i className="ri-add-circle-line me-2"></i>Thêm quy tắc giá mới</>
            ) : (
              <><i className="ri-edit-2-line me-2"></i>Chỉnh sửa quy tắc giá</>
            )}
          </Modal.Title>
        </Modal.Header>
        <Form id="pricingForm" onSubmit={handleSubmit} noValidate>
          <Modal.Body>
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label><i className="ri-global-line me-2"></i>Tour áp dụng</Form.Label>
                  <Form.Select 
                    name="selectedTourId"
                    value={selectedTourId} 
                    onChange={e => setSelectedTourId(e.target.value)}
                    required
                    className="shadow-sm"
                  >
                    <option value="">-- Chọn tour --</option>
                    {tours.map(tour => (
                      <option key={tour._id} value={tour._id}>
                        {String(tour.title || 'Unnamed Tour').trim()}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label>Loại quy tắc</Form.Label>
                  <Form.Select 
                    name="ruleType"
                    value={ruleType} 
                    onChange={e => setRuleType(e.target.value)}
                    required
                    disabled={modalMode === 'edit'}
                  >
                    <option value="ageBracket">Phân loại theo độ tuổi</option>
                    <option value="seasonal">Giá theo mùa</option>
                    <option value="promotion">Khuyến mãi</option>
                    <option value="surcharge">Phụ thu</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Tabs 
              activeKey={ruleType} 
              onSelect={(k) => {
                console.log("Tab changed to:", k);
                setRuleType(k);
              }}
              className="mb-3"
            >
              <Tab eventKey="ageBracket" title="Phân loại độ tuổi">
                <Form.Group className="mb-3">
                  <Form.Label>Tên quy tắc</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="age_bracket_rule_name"
                    placeholder="Vd: Phân loại vé cơ bản"
                    value={ageBracketForm.name}
                    onChange={e => setAgeBracketForm({...ageBracketForm, name: e.target.value})}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Mô tả</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    name="ageBracketDescription"
                    rows={2}
                    placeholder="Mô tả chi tiết về quy tắc này"
                    value={ageBracketForm.description}
                    onChange={e => setAgeBracketForm({...ageBracketForm, description: e.target.value})}
                  />
                </Form.Group>

                <h5 className="mt-4">Danh sách phân loại vé</h5>
                {ageBracketForm.ageBrackets.map((bracket, idx) => (
                  <Card key={idx} className="mb-3">
                    <Card.Body>
                      <Row className="mb-3">
                        <Col>
                          <Form.Group>
                            <Form.Label>Tên loại vé</Form.Label>
                            <Form.Control 
                              type="text"
                              name={`bracket-name-${idx}`}
                              placeholder="Vd: Người lớn, Trẻ em, ..."
                              value={bracket.name}
                              onChange={e => updateBracket(idx, 'name', e.target.value)}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={2}>
                          <Form.Group>
                            <Form.Label>Độ tuổi từ</Form.Label>
                            <Form.Control 
                              type="number" 
                              name={`bracket-min-age-${idx}`}
                              min="0"
                              max="120"
                              value={bracket.minAge || ''}
                              onChange={e => updateBracket(idx, 'minAge', parseInt(e.target.value) || null)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={2}>
                          <Form.Group>
                            <Form.Label>Độ tuổi đến</Form.Label>
                            <Form.Control 
                              type="number" 
                              name={`bracket-max-age-${idx}`}
                              min="0"
                              max="120"
                              value={bracket.maxAge || ''}
                              onChange={e => updateBracket(idx, 'maxAge', parseInt(e.target.value) || null)}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col>
                          <Form.Group>
                            <Form.Label>Loại giảm giá</Form.Label>
                            <Form.Select
                              name={`bracket-discount-type-${idx}`}
                              value={bracket.discountType}
                              onChange={e => updateBracket(idx, 'discountType', e.target.value)}
                            >
                              <option value="percentage">Phần trăm (%)</option>
                              <option value="fixedAmount">Số tiền cố định</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col>
                          <Form.Group>
                            <Form.Label>Giá trị giảm</Form.Label>
                            <Form.Control 
                              type="number" 
                              name={`bracket-discount-value-${idx}`}
                              min="0"
                              step="0.01"
                              value={bracket.discountValue}
                              onChange={e => updateBracket(idx, 'discountValue', parseFloat(e.target.value) || 0)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group className="mt-4">
                            <Form.Check 
                              type="checkbox" 
                              label="Yêu cầu ID xác thực" 
                              checked={bracket.requiredId}
                              onChange={e => updateBracket(idx, 'requiredId', e.target.checked)}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      {ageBracketForm.ageBrackets.length > 1 && (
                        <div className="text-end mt-2">
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => removeBracket(idx)}
                          >
                            Xóa phân loại
                          </Button>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                ))}
                <Button 
                  variant="outline-primary" 
                  className="w-100 mt-2" 
                  onClick={addBracket}
                >
                  + Thêm phân loại vé
                </Button>
              </Tab>

              <Tab eventKey="seasonal" title="Giá theo mùa">
                <Form.Group className="mb-3">
                  <Form.Label>Tên quy tắc</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="seasonal_rule_name"
                    placeholder="Vd: Giá mùa cao điểm"
                    value={seasonalForm.name}
                    onChange={e => setSeasonalForm({...seasonalForm, name: e.target.value})}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Mô tả</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    name="seasonalDescription"
                    rows={2}
                    placeholder="Mô tả chi tiết về quy tắc này"
                    value={seasonalForm.description}
                    onChange={e => setSeasonalForm({...seasonalForm, description: e.target.value})}
                  />
                </Form.Group>

                <h5 className="mt-4">Danh sách mùa</h5>
                {seasonalForm.seasonalPricing.map((season, idx) => (
                  <Card key={idx} className="mb-3">
                    <Card.Body>
                      <Row className="mb-3">
                        <Col>
                          <Form.Group>
                            <Form.Label>Tên mùa</Form.Label>
                            <Form.Control 
                              type="text" 
                              name={`seasonName-${idx}`}
                              placeholder="Vd: Mùa cao điểm, Mùa thấp điểm, ..."
                              value={season.name}
                              onChange={e => updateSeason(idx, 'name', e.target.value)}
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row className="mb-3">
                        <Col>
                          <Form.Group>
                            <Form.Label>Ngày bắt đầu</Form.Label>
                            <Form.Control 
                              type="date" 
                              name={`seasonStartDate-${idx}`}
                              value={season.startDate ? season.startDate.split('T')[0] : ''}
                              onChange={e => updateSeason(idx, 'startDate', e.target.value)}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col>
                          <Form.Group>
                            <Form.Label>Ngày kết thúc</Form.Label>
                            <Form.Control 
                              type="date" 
                              name={`seasonEndDate-${idx}`}
                              value={season.endDate ? season.endDate.split('T')[0] : ''}
                              onChange={e => updateSeason(idx, 'endDate', e.target.value)}
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Hệ số giá (×)</Form.Label>
                            <Form.Control 
                              type="number" 
                              name={`seasonPriceMultiplier-${idx}`}
                              min="0.1"
                              step="0.01"
                              value={season.priceMultiplier}
                              onChange={e => updateSeason(idx, 'priceMultiplier', parseFloat(e.target.value) || 1)}
                              required
                            />
                            <Form.Text className="text-muted">
                              1 = giá gốc, 1.2 = tăng 20%, 0.8 = giảm 20%
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>
                      {seasonalForm.seasonalPricing.length > 1 && (
                        <div className="text-end mt-2">
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => removeSeason(idx)}
                          >
                            Xóa mùa
                          </Button>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                ))}
                <Button 
                  variant="outline-primary" 
                  className="w-100 mt-2" 
                  onClick={addSeason}
                >
                  + Thêm mùa
                </Button>
              </Tab>

              <Tab eventKey="promotion" title="Khuyến mãi">
                <Form.Group className="mb-3">
                  <Form.Label>Tên quy tắc</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="promotion_rule_name"
                    placeholder="Vd: Early Bird 2025"
                    value={promotionForm.name}
                    onChange={e => setPromotionForm({...promotionForm, name: e.target.value})}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Mô tả</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    name="promotionDescription"
                    rows={2}
                    placeholder="Mô tả chi tiết về quy tắc này"
                    value={promotionForm.description}
                    onChange={e => setPromotionForm({...promotionForm, description: e.target.value})}
                  />
                </Form.Group>

                <Card className="mb-3">
                  <Card.Body>
                    <Row className="mb-3">
                      <Col>
                        <Form.Group>
                          <Form.Label>Tên khuyến mãi</Form.Label>
                          <Form.Control 
                            type="text" 
                            name="promotionTypeName"
                            placeholder="Vd: Early Bird, Last Minute, ..."
                            value={promotionForm.promotion.name}
                            onChange={e => updatePromotion('name', e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row className="mb-3">
                      <Col>
                        <Form.Group>
                          <Form.Label>Ngày bắt đầu</Form.Label>
                          <Form.Control 
                            type="date" 
                            name="promotionStartDate"
                            value={promotionForm.promotion.startDate ? promotionForm.promotion.startDate.split('T')[0] : ''}
                            onChange={e => updatePromotion('startDate', e.target.value)}
                            // Remove required attribute to make it optional
                          />
                          <Form.Text className="text-muted">
                            Để trống nếu không giới hạn
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col>
                        <Form.Group>
                          <Form.Label>Ngày kết thúc</Form.Label>
                          <Form.Control 
                            type="date" 
                            name="promotionEndDate"
                            value={promotionForm.promotion.endDate ? promotionForm.promotion.endDate.split('T')[0] : ''}
                            onChange={e => updatePromotion('endDate', e.target.value)}
                            // Remove required attribute to make it optional
                          />
                          <Form.Text className="text-muted">
                            Để trống nếu không giới hạn
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row className="mb-3">
                      <Col>
                        <Form.Group>
                          <Form.Label>Số ngày trước khởi hành (Early Bird)</Form.Label>
                          <Form.Control 
                            type="number" 
                            name="daysBeforeDeparture"
                            min="0"
                            value={promotionForm.promotion.daysBeforeDeparture || ''}
                            onChange={e => updatePromotion('daysBeforeDeparture', parseInt(e.target.value) || null)}
                          />
                          <Form.Text className="text-muted">
                            Áp dụng khi đặt tour trước ngày khởi hành ít nhất số ngày này
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col>
                        <Form.Group>
                          <Form.Label>Tối đa số ngày trước khởi hành (Last Minute)</Form.Label>
                          <Form.Control 
                            type="number" 
                            name="daysBeforeDepartureMax"
                            min="0"
                            value={promotionForm.promotion.daysBeforeDepartureMax || ''}
                            onChange={e => updatePromotion('daysBeforeDepartureMax', parseInt(e.target.value) || null)}
                          />
                          <Form.Text className="text-muted">
                            Áp dụng khi đặt tour trước khởi hành tối đa số ngày này
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col>
                        <Form.Group>
                          <Form.Label>Loại giảm giá</Form.Label>
                          <Form.Select
                            name="promotionDiscountType"
                            value={promotionForm.promotion.discountType}
                            onChange={e => updatePromotion('discountType', e.target.value)}
                            required
                          >
                            <option value="percentage">Phần trăm (%)</option>
                            <option value="fixedAmount">Số tiền cố định</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col>
                        <Form.Group>
                          <Form.Label>Giá trị giảm</Form.Label>
                          <Form.Control 
                            type="number" 
                            name="discountValue"
                            min="0"
                            step="0.01"
                            value={promotionForm.promotion.discountValue}
                            onChange={e => updatePromotion('discountValue', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab>

              <Tab eventKey="surcharge" title="Phụ thu">
                <Form.Group className="mb-3">
                  <Form.Label>Tên quy tắc</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="surcharge_rule_name"
                    placeholder="Vd: Phụ thu cuối tuần"
                    value={surchargeForm.name}
                    onChange={e => setSurchargeForm({...surchargeForm, name: e.target.value})}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Mô tả</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    name="surchargeDescription"
                    rows={2}
                    placeholder="Mô tả chi tiết về quy tắc này"
                    value={surchargeForm.description}
                    onChange={e => setSurchargeForm({...surchargeForm, description: e.target.value})}
                  />
                </Form.Group>

                <Card className="mb-3">
                  <Card.Body>
                    <Row className="mb-3">
                      <Col>
                        <Form.Group>
                          <Form.Label>Tên phụ thu</Form.Label>
                          <Form.Control 
                            type="text" 
                            name="surchargeTypeName"
                            placeholder="Vd: Phụ thu phòng đơn"
                            value={surchargeForm.surcharge.name}
                            onChange={e => updateSurcharge('name', e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col>
                        <Form.Group>
                          <Form.Label>Loại phụ thu</Form.Label>
                          <Form.Select
                            name="surchargeApplicableType"
                            value={surchargeForm.surcharge.applicableType}
                            onChange={e => updateSurcharge('applicableType', e.target.value)}
                            required
                          >
                            <option value="singleRoom">Phòng đơn</option>
                            <option value="weekend">Cuối tuần</option>
                            <option value="holiday">Ngày lễ</option>
                            <option value="other">Khác</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    {surchargeForm.surcharge.applicableType === 'weekend' && (
                      <Row className="mb-3">
                        <Col>
                          <Form.Group>
                            <Form.Label>Ngày trong tuần</Form.Label>
                            <div className="d-flex gap-2">
                              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, i) => (
                                <Form.Check 
                                  key={i}
                                  type="checkbox" 
                                  id={`weekday-${i}`}
                                  label={day}
                                  checked={surchargeForm.surcharge.daysOfWeek?.includes(i)}
                                  onChange={() => toggleWeekendDay(i)}
                                />
                              ))}
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>
                    )}
                    
                    {surchargeForm.surcharge.applicableType === 'holiday' && (
                      <Row className="mb-3">
                        <Col>
                          <Form.Group>
                            <Form.Label>Ngày lễ</Form.Label>
                            <Form.Control 
                              type="date" 
                              name="surchargeHolidayDate"
                              value={''}
                              onChange={e => {
                                const date = e.target.value;
                                if (date) {
                                  updateSurcharge('dates', [
                                    ...(surchargeForm.surcharge.dates || []), 
                                    new Date(date)
                                  ]);
                                }
                                e.target.value = '';
                              }}
                            />
                          </Form.Group>
                          
                          {surchargeForm.surcharge.dates && surchargeForm.surcharge.dates.length > 0 && (
                            <div className="mt-2">
                              <p className="mb-1">Ngày đã chọn:</p>
                              <div className="d-flex flex-wrap gap-2">
                                {surchargeForm.surcharge.dates.map((date, i) => (
                                  <Badge 
                                    key={i} 
                                    bg="primary" 
                                    className="p-2"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => {
                                      const newDates = [...surchargeForm.surcharge.dates];
                                      newDates.splice(i, 1);
                                      updateSurcharge('dates', newDates);
                                    }}
                                  >
                                    {new Date(date).toLocaleDateString('vi-VN')} ×
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </Col>
                      </Row>
                    )}
                    
                    <Row>
                      <Col>
                        <Form.Group>
                          <Form.Label>Loại phụ thu</Form.Label>
                          <Form.Select
                            name="surchargeChargeType"
                            value={surchargeForm.surcharge.chargeType}
                            onChange={e => updateSurcharge('chargeType', e.target.value)}
                            required
                          >
                            <option value="percentage">Phần trăm (%)</option>
                            <option value="fixedAmount">Số tiền cố định</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col>
                        <Form.Group>
                          <Form.Label>Giá trị phụ thu</Form.Label>
                          <Form.Control 
                            type="number" 
                            name="surchargeValue"
                            min="0"
                            step="0.01"
                            value={surchargeForm.surcharge.chargeValue}
                            onChange={e => updateSurcharge('chargeValue', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab>
            </Tabs>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Hủy
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading}
              onClick={(e) => {
                console.log("Submit button clicked");
                // Thực hiện manual validation để đảm bảo không có lỗi validation trước khi submit
                const form = document.getElementById('pricingForm');
                if (form) {
                  console.log("Form found, triggering submit");
                }
              }}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Đang xử lý...
                </>
              ) : (
                modalMode === 'create' ? 'Tạo quy tắc' : 'Cập nhật'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default PricingManager;
