import React, { useRef } from 'react';
import "./Search-Bar.css";
import { Col, Form, FormGroup } from "reactstrap";
import { BASE_URL } from '../utils/config';
import { useNavigate } from 'react-router-dom';

const SearchBar = () => {
  const locationRef = useRef('');
  const distanceRef = useRef('0');
  const maxGroupSizeRef = useRef('0');
  const navigate = useNavigate();

  const searchHandler = async () => {
    const location = locationRef.current.value;
    const distance = distanceRef.current.value;
    const maxGroupSize = maxGroupSizeRef.current.value;

    if (location === '' || distance === '' || maxGroupSize === '') {
      return alert('Vui lòng điền đầy đủ thông tin!');
    }

    try {
      const res = await fetch(
        `${BASE_URL}/tour/search/getTourBySearch?city=${location}&distance=${distance}&maxGroupSize=${maxGroupSize}`
      );

      if (!res.ok) {
        return alert('Đã có lỗi xảy ra!');
      }

      const result = await res.json();

      // ✅ Chuyển hướng đến trang kết quả với dữ liệu
      navigate(
        `/tours/search?city=${location}&distance=${distance}&maxGroupSize=${maxGroupSize}`,
        { state: result.data }
      );

    } catch (err) {
      console.error("Lỗi khi tìm kiếm tour:", err);
      alert("Không thể tìm kiếm tour.");
    }
  };

  return (
    <Col lg="12">
      <div className="search__bar">
        <Form className="d-flex align-items-center gap-4">
          <FormGroup className="d-flex gap-3 form_group form_group-fast">
            <span><i className="ri-map-pin-line"></i></span>
            <div>
              <h6>Vị Trí</h6>
              <input type="text" placeholder="Bạn muốn du lịch ở đâu?" ref={locationRef} />
            </div>
          </FormGroup>

          <FormGroup className="d-flex gap-3 form_group form_group-fast">
            <span><i className="ri-map-pin-time-line"></i></span>
            <div>
              <h6>Khoảng cách</h6>
              <input type="number" placeholder="Khoảng cách (km)" ref={distanceRef} />
            </div>
          </FormGroup>

          <FormGroup className="d-flex gap-3 form_group form_group-fast">
            <span><i className="ri-group-line"></i></span>
            <div>
              <h6>Số lượng người</h6>
              <input type="number" placeholder="0" ref={maxGroupSizeRef} />
            </div>
          </FormGroup>

          <span className="search_icon" onClick={searchHandler}>
            <i className="ri-search-2-line"></i>
          </span>
        </Form>
      </div>
    </Col>
  );
};

export default SearchBar;
