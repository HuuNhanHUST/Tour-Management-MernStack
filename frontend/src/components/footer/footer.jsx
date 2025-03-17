import React from "react";
import "./footer.css";
import { Container, Row, Col, ListGroup, ListGroupItem } from "reactstrap";
import { Link } from "react-router-dom";
import logo from "../../assets/images/logo.png";

const quickLinks = [
  { path: "/home", display: "Home" },
  { path: "/about", display: "About" },
  { path: "/tours", display: "Tours" },
];

const quickLinks2 = [
  { path: "/gallery", display: "Gallery" },
  { path: "/login", display: "Login" },
  { path: "/register", display: "Register" },
];

const SocialLinks = () => (
  <div className="social_links d-flex align-items-center gap-4">
    <span>
      <Link to="#">
        <i className="ri-youtube-line"></i>
      </Link>
    </span>
    <span>
      <Link to="#">
        <i className="ri-github-fill"></i>
      </Link>
    </span>
    <span>
      <Link to="#">
        <i className="ri-facebook-fill"></i>
      </Link>
    </span>
    <span>
      <Link to="#">
        <i className="ri-instagram-fill"></i>
      </Link>
    </span>
  </div>
);

const QuickLinks = ({ title, links }) => (
  <Col lg="3">
    <h5 className="footer__link-title">{title}</h5>
    <ListGroup className="footer__quick-links">
      {links.map((item, index) => (
        <ListGroupItem key={index} className="ps-0 border-0">
          <Link to={item.path}>{item.display}</Link>
        </ListGroupItem>
      ))}
    </ListGroup>
  </Col>
);

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container>
        <Row>
          <Col lg="3">
            <div className="logo">
              <img src={logo} alt="Logo" />
              <p>
              Du lịch là trải nghiệm văn hóa, ẩm thực và con người. Mỗi chuyến đi là kỷ niệm, mở rộng tầm mắt, làm giàu tâm hồn.
              </p>
              <SocialLinks />
            </div>
          </Col>

          <QuickLinks title="Khám Phá" links={quickLinks} />
          <QuickLinks title="Liên kết nhanh" links={quickLinks2} />

          <Col lg="3">
            <h5 className="footer__link-title">Liên Hệ</h5>
            <ListGroup className="footer__quick-links">
              <ListGroupItem className="ps-0 border-0 d-flex align-items-center gap-3">
                <h6>
                  <i className="ri-map-pin-fill"></i> Address:
                </h6>
                <p className="mb-0">Thủ Đức, Thành Phố Hồ Chí Minh</p>
              </ListGroupItem>

              <ListGroupItem className="ps-0 border-0 d-flex align-items-center gap-3">
                <h6>
                  <i className="ri-mail-line"></i> Email:
                </h6>
                <p className="mb-0">Nhansever9999@gmail.com</p>
              </ListGroupItem>

              <ListGroupItem className="ps-0 border-0 d-flex align-items-center gap-3">
                <h6>
                  <i className="ri-phone-line"></i> Phone:
                </h6>
                <p className="mb-0">0318102004</p>
              </ListGroupItem>
            </ListGroup>
          </Col>

          <Col lg="12" className="text-center pt-5">
            <div className="copyright">
              Copyright {year}, Thiết kế và lập trình bởi Đoàn Hữu Nhân. All
              rights reserved.
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
