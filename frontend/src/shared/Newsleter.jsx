import React from 'react';
import './newsleter.css';
import { Container, Row, Col } from 'reactstrap';
import maleTourist from '../assets/images/male-tourist.png';

const Newsletter = () => {
  return (
    <section className='newsletter py-5' style={{ background: '#eaf6ff' }}>
      <Container>
        <Row className='align-items-center'>
          <Col lg='6' className='mb-4 mb-lg-0'>
            <div className="newsletter__content">
              <h2 className="fw-bold mb-3">✈️ Đăng ký để nhận ưu đãi du lịch mỗi tuần!</h2>
              <p className="text-muted mb-4">
                Nhận ngay thông tin tour mới nhất, voucher độc quyền và gợi ý hành trình từ TravelWorld.
              </p>
              <div className="newsletter__input d-flex">
                <input
                  type="email"
                  className="form-control me-2"
                  placeholder="Nhập email của bạn..."
                />
                <button className="btn newsletter__btn btn-warning fw-bold">Subscribe</button>
              </div>
            </div>
          </Col>
          <Col lg='6' className="text-center">
            <div className="newsletter__img">
              <img src={maleTourist} alt="Tourist" className="img-fluid" style={{ maxHeight: '300px' }} />
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Newsletter;
