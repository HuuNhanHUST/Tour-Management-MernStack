import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Table, Badge, Button, Form, InputGroup, Spinner } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const BookingList = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:4000/api/v1/booking", {
        withCredentials: true,
      });

      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error("❌ Error fetching bookings:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert("Bạn không có quyền truy cập!");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const filterBookings = useCallback(() => {
    let filtered = [...bookings];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (booking) =>
          booking.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.phone?.includes(searchTerm) ||
          booking.tourName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking._id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter((booking) => booking.paymentStatus === statusFilter);
    }

    // Payment method filter
    if (paymentMethodFilter !== "All") {
      filtered = filtered.filter((booking) => booking.paymentMethod === paymentMethodFilter);
    }

    // Date range filter
    if (startDate && endDate) {
      filtered = filtered.filter((booking) => {
        const bookDate = new Date(booking.bookAt);
        return bookDate >= startDate && bookDate <= endDate;
      });
    }

    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [bookings, searchTerm, statusFilter, paymentMethodFilter, startDate, endDate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    filterBookings();
  }, [filterBookings]);

  const getStatusBadge = (status) => {
    const config = {
      Pending: "warning",
      Confirmed: "success",
      Failed: "danger",
      Cancelled: "secondary",
    };
    return <Badge bg={config[status] || "secondary"}>{status}</Badge>;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return amount?.toLocaleString("vi-VN") + "₫";
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleViewDetails = (bookingId) => {
    navigate(`/admin/bookings/${bookingId}`);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setPaymentMethodFilter("All");
    setStartDate(null);
    setEndDate(null);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem" }} />
        <p className="mt-3">Đang tải danh sách booking...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold">
          <i className="ri-file-list-3-line me-2"></i>
          Quản lý Booking
        </h3>
        <Button variant="outline-secondary" onClick={fetchBookings}>
          <i className="ri-refresh-line me-1"></i> Làm mới
        </Button>
      </div>

      {/* Filters */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            {/* Search */}
            <div className="col-md-4">
              <label className="form-label fw-semibold">Tìm kiếm</label>
              <InputGroup>
                <InputGroup.Text>
                  <i className="ri-search-line"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Tên, SĐT, Tour, Mã booking..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>

            {/* Status Filter */}
            <div className="col-md-2">
              <label className="form-label fw-semibold">Trạng thái</label>
              <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">Tất cả</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Failed">Failed</option>
                <option value="Cancelled">Cancelled</option>
              </Form.Select>
            </div>

            {/* Payment Method Filter */}
            <div className="col-md-2">
              <label className="form-label fw-semibold">Thanh toán</label>
              <Form.Select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
              >
                <option value="All">Tất cả</option>
                <option value="Cash">Cash</option>
                <option value="MoMo">MoMo</option>
              </Form.Select>
            </div>

            {/* Date Range */}
            <div className="col-md-2">
              <label className="form-label fw-semibold">Từ ngày</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                className="form-control"
                dateFormat="dd/MM/yyyy"
                placeholderText="Chọn ngày"
              />
            </div>

            <div className="col-md-2">
              <label className="form-label fw-semibold">Đến ngày</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                className="form-control"
                dateFormat="dd/MM/yyyy"
                placeholderText="Chọn ngày"
              />
            </div>
          </div>

          <div className="mt-3 d-flex gap-2">
            <Button variant="primary" size="sm" onClick={filterBookings}>
              <i className="ri-filter-line me-1"></i> Áp dụng
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
              <i className="ri-close-line me-1"></i> Xóa bộ lọc
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card bg-primary bg-opacity-10 border-0">
            <div className="card-body">
              <h6 className="text-muted mb-1">Tổng booking</h6>
              <h3 className="mb-0">{filteredBookings.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning bg-opacity-10 border-0">
            <div className="card-body">
              <h6 className="text-muted mb-1">Chờ xử lý</h6>
              <h3 className="mb-0">
                {filteredBookings.filter((b) => b.paymentStatus === "Pending").length}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success bg-opacity-10 border-0">
            <div className="card-body">
              <h6 className="text-muted mb-1">Đã xác nhận</h6>
              <h3 className="mb-0">
                {filteredBookings.filter((b) => b.paymentStatus === "Confirmed").length}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger bg-opacity-10 border-0">
            <div className="card-body">
              <h6 className="text-muted mb-1">Đã hủy</h6>
              <h3 className="mb-0">
                {filteredBookings.filter((b) => b.paymentStatus === "Cancelled").length}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <Table hover>
              <thead className="table-light">
                <tr>
                  <th width="50">#</th>
                  <th width="120">Mã Booking</th>
                  <th>Khách hàng</th>
                  <th>Tour</th>
                  <th width="80" className="text-center">Số khách</th>
                  <th width="120">Ngày đặt</th>
                  <th width="130" className="text-end">Tổng tiền</th>
                  <th width="100">Thanh toán</th>
                  <th width="120" className="text-center">Trạng thái</th>
                  <th width="100" className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {currentBookings.length > 0 ? (
                  currentBookings.map((booking, index) => (
                    <tr key={booking._id}>
                      <td>{indexOfFirstItem + index + 1}</td>
                      <td>
                        <code className="small">#{booking._id.slice(-8)}</code>
                      </td>
                      <td>
                        <div>
                          <strong>{booking.fullName}</strong>
                        </div>
                        <small className="text-muted">{booking.phone}</small>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: "200px" }}>
                          {booking.tourName}
                        </div>
                      </td>
                      <td className="text-center">
                        <Badge bg="info">{booking.guestSize}</Badge>
                      </td>
                      <td>{formatDate(booking.bookAt)}</td>
                      <td className="text-end">
                        <strong>{formatCurrency(booking.totalAmount)}</strong>
                      </td>
                      <td>
                        <Badge bg={booking.paymentMethod === "MoMo" ? "primary" : "secondary"}>
                          {booking.paymentMethod}
                        </Badge>
                      </td>
                      <td className="text-center">{getStatusBadge(booking.paymentStatus)}</td>
                      <td className="text-center">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleViewDetails(booking._id)}
                        >
                          <i className="ri-eye-line"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center py-4">
                      <i className="ri-inbox-line fs-1 text-muted"></i>
                      <p className="text-muted mb-0">Không tìm thấy booking nào</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted">
                Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredBookings.length)} / {filteredBookings.length} bookings
              </div>
              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
                      Trước
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                    ) {
                      return (
                        <li
                          key={pageNumber}
                          className={`page-item ${currentPage === pageNumber ? "active" : ""}`}
                        >
                          <button className="page-link" onClick={() => handlePageChange(pageNumber)}>
                            {pageNumber}
                          </button>
                        </li>
                      );
                    } else if (pageNumber === currentPage - 3 || pageNumber === currentPage + 3) {
                      return (
                        <li key={pageNumber} className="page-item disabled">
                          <span className="page-link">...</span>
                        </li>
                      );
                    }
                    return null;
                  })}
                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
                      Sau
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingList;
