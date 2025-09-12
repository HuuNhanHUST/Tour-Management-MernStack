import React, { useState, useContext } from "react";
import { Container, Row, Col, Form, FormGroup, Button } from "reactstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/login.css";

import loginImg from "../assets/images/login.png";
import userIcon from "../assets/images/user.png";

import { AuthContext } from "../context/AuthContext";
import { BASE_URL } from "../utils/config";

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState(null);
  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setCredentials((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleClick = async (e) => {
    e.preventDefault();

    dispatch({ type: "LOGIN_START" });
    setError(null);

    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(credentials),
        credentials: "include"
      });

      const result = await res.json();

      if (!res.ok) {
        dispatch({ type: "LOGIN_FAILURE", payload: result.message });
        setError(result.message || "Đăng nhập thất bại");
        return;
      }

      const fixedUser = {
  ...result.data,
  _id: result.data._id ?? result.data.id
};
console.log("✔️ User saved to localStorage:", fixedUser); // Thêm log
dispatch({ type: "LOGIN_SUCCESS", payload: fixedUser });
      alert("Đăng nhập thành công!");

      const searchParams = new URLSearchParams(location.search);
      const redirectSlug = searchParams.get("redirect");

      // ✅ Điều hướng theo vai trò
      if (result.data.role === "admin") {
        navigate("/admin");
      } else if (redirectSlug) {
        navigate(`/tour/${redirectSlug}`);
      } else {
        navigate("/");
      }

    } catch (err) {
      dispatch({ type: "LOGIN_FAILURE", payload: err.message });
      setError("Đã có lỗi xảy ra khi đăng nhập.");
    }
  };

  const handleFacebookLogin = () => {
    const redirectSlug = new URLSearchParams(location.search).get("redirect") || "";
    window.open(`${BASE_URL}/auth/facebook?redirect=${redirectSlug}`, "_self");
  };

  return (
    <section>
      <Container>
        <Row>
          <Col lg="8" className="m-auto">
            <div className="login__container d-flex justify-content-between">
              <div className="login__img">
                <img src={loginImg} alt="Login" />
              </div>
              <div className="login__form">
                <div className="user">
                  <img src={userIcon} alt="User" />
                </div>
                <h2>Đăng Nhập</h2>
                <Form onSubmit={handleClick}>
                  <FormGroup>
                    <input
                      type="email"
                      placeholder="Email"
                      required
                      id="email"
                      onChange={handleChange}
                    />
                  </FormGroup>

                  <FormGroup>
                    <input
                      type="password"
                      placeholder="Mật khẩu"
                      required
                      id="password"
                      onChange={handleChange}
                    />
                  </FormGroup>

                  {error && <p className="text-danger">{error}</p>}

                  <Button className="btn secondary_btn auth__btn" type="submit">
                    Đăng Nhập
                  </Button>
                </Form>

                <div className="mt-3 text-center">
                  <Button
                    className="btn primary_btn auth__btn"
                    color="primary"
                    onClick={handleFacebookLogin}
                  >
                    Đăng nhập bằng Facebook
                  </Button>
                </div>

                <p className="mt-3">
                  Chưa có tài khoản? <Link to="/register">Tạo Ngay</Link>
                </p>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Login;
