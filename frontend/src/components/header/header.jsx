import React, { useRef, useEffect, useState, useContext } from "react";
import { Container, Row, Button } from "reactstrap";
import { NavLink, Link, useNavigate } from "react-router-dom";

import logo from "../../assets/images/logo.png";
import "./header.css";

import { AuthContext } from "../../context/AuthContext";

// ✅ Menu chính (Lịch sử thanh toán chỉ hiển thị khi có user)
const nav_links = [
  { path: "/home", display: "Home" },
  { path: "/about", display: "About" },
  { path: "/tour", display: "Tours" },
  { path: "/payment-history", display: "Lịch sử thanh toán" } ,
  { path: "/saved-tours", display: "Yêu thích" }

];

const Header = () => {
  const headerRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:4000/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      dispatch({ type: "LOGOUT" });
      localStorage.removeItem("user");
      navigate("/login");
    } catch (err) {
      console.error("❌ Lỗi khi logout:", err);
    }
  };

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
            {/* Logo */}
            <div className="logo">
              <img src={logo} alt="Logo" />
            </div>

            {/* Menu */}
            <div className={`navigation menu ${menuOpen ? "open" : ""}`}>
              <ul className="d-flex align-items-center gap-5">
                {nav_links
                  .filter((item) => (item.path !== "/payment-history" && item.path !== "/saved-tours") || user )
                  .map((item, index) => (
                    <li className="nav__item" key={index}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          isActive ? "active_link" : ""
                        }
                        onClick={() => setMenuOpen(false)}
                      >
                        {item.display}
                      </NavLink>
                    </li>
                  ))}
              </ul>
            </div>

            {/* Right side: login/register or user/logout */}
            <div className="nav_right d-flex align-items-center gap-4">
              <div className="nav_btns d-flex align-items-center gap-4">
                {user ? (
                  <>
                    <h5 className="mb-0">{user.username}</h5>
                    <Button className="btn secondary__btn" onClick={handleLogout}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="btn secondary__btn">
                      <Link to="/login">Login</Link>
                    </Button>
                    <Button className="btn primary__btn">
                      <Link to="/register">Register</Link>
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <span
                className="mobile__menu"
                onClick={() => setMenuOpen(!menuOpen)}
              >
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
