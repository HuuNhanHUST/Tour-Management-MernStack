import React, { useRef, useEffect, useState } from "react";
import { Container, Row, Button } from "reactstrap";
import { NavLink, Link } from "react-router-dom";

import logo from "../../assets/images/logo.png";
import "./header.css";

const nav_links = [
  { path: "/home", display: "Home" },
  { path: "/about", display: "About" },
  { path: "/tour", display: "Tours" },
];

const Header = () => {
  const headerRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        headerRef.current.classList.add("sticky__header");
      } else {
        headerRef.current.classList.remove("sticky__header");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="header" ref={headerRef}>
      <Container>
        <Row>
          <div className="nav__wrapper d-flex align-items-center justify-content-between">
            {/* ---------- Logo ---------- */}
            <div className="logo">
              <img src={logo} alt="Logo" />
            </div>

            {/* ---------- Menu ---------- */}
            <div className={`navigation menu ${menuOpen ? "open" : ""}`}>
              <ul className="d-flex align-items-center gap-5">
                {nav_links.map((item, index) => (
                  <li className="nav__item" key={index}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => (isActive ? "active_link" : "")}
                      onClick={() => setMenuOpen(false)} // Đóng menu khi chọn link
                    >
                      {item.display}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

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
              {/* Mobile Menu Toggle Button */}
              <span className="mobile__menu" onClick={() => setMenuOpen(!menuOpen)}>
                <i className="ri-menu-line"></i>
              </span>
            </div>
          </div>
        </Row>
      </Container>
    </header>
  );
};

export default Header;
