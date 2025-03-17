import React from "react";
import { Container, Row, Button } from "reactstrap";
import { NavLink, Link } from "react-router-dom";

import logo from "../../assets/images/logo.png";
import './header.css'

const nav_links = [
  {
    path: "/home",
    display: "Home",
  },
  {
    path: "/about",
    display: "About",
  },
  {
    path: "/tours",
    display: "Tours",
  },
];

const Header = () => {
  return (
    <header className="header">
      <Container>
        <Row>
          <div className="nav__wrapper d-flex align-items-center justify-content-between">
            {/* ---------- Logo ---------- */}
            <div className="logo">
              <img src={logo} alt="Logo" />
            </div>
            {/* ---------- Logo end ---------- */}

            {/* ---------- Menu start ---------- */}
            <div className="navigation">
              <ul className="menu d-flex align-items-center gap-5">
                {nav_links.map((item, index) => (
                  <li className="nav__item" key={index}>
                    <NavLink to={item.path} className={({ isActive }) => isActive ? 'active__link' : ""}>
                      {item.display}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
            {/* ---------- Menu end ---------- */}

            {/* ---------- Right Section ---------- */}
            <div className="nav_right d-flex align-items-center gap-4">
              <div className="nav_btns d-flex align-items-center gap-4">
                <Button className="btn secondary__btn">
                  <Link to="/login">Login</Link>
                </Button>
                <Button className="btn primary__btn">
                  <Link to="/register">Register</Link>
                </Button>
              </div>
              <span className="mobile_menu"></span>
              <i className="ri-menu-line"></i>
            </div>
            {/* ---------- Right Section end ---------- */}
          </div>
        </Row>
      </Container>
    </header>
  );
};

export default Header;
