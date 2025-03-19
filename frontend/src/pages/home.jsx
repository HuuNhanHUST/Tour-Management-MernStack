import React from 'react';
import { Container, Row, Col } from 'reactstrap';
import '../styles/home.css';
import Subtitle from '../shared/subtitle';
import heroImg from '../assets/images/hero-img01.jpg';
import heroImg02 from '../assets/images/hero-img02.jpg';
import heroVideo from '../assets/images/hero-video.mp4';
import worldImg from '../assets/images/world.png';
import experienceImg from '../assets/images/experience.png';
import SearchBar from '../shared/SearchBar';
import ServiceList from '../services/ServiceList';
import FeaturedTourList from '../components/Featured-tour/FeaturedTourList';
import MasonryImagesGallery from '../components/Image-gallery/MasonryImagesGallery';
import Testimonials from '../components/Testimonial/Testimonials';
import Newsletter from '../shared/Newsleter';

const Home = () => {
  return (
    <>
      <section>
        <Container>
          <Row>
            <Col lg="6">
              <div className="hero__content">
                <div className="hero__subtitle d-flex align-items-center">
                  <Subtitle subtitle={'Du lịch Và Sự Tự Do '} />
                  <img src={worldImg} alt="" />
                </div>
                <h1>
                  Du lịch là cách để tâm hồn được tự do và trái tim được rộng mở.{' '}
                  <span className="highlight"></span>
                </h1>
                <p>
                  Hãy ngồi xuống, hít thở không khí trong lành và cảm nhận sự kết nối giữa thiên nhiên và con người.
                  Du lịch không chỉ là khám phá những vùng đất mới, mà còn là cơ hội để ta tìm lại chính mình,
                  để tâm hồn được thảnh thơi và trái tim được rộng mở. Những khoảnh khắc chia sẻ niềm vui bên bạn bè,
                  người thân, hay thậm chí là những người bạn mới quen, sẽ trở thành hành trang quý giá trong cuộc đời.
                  Dù có khó khăn hay bộn bề, chỉ cần bước chân ra thế giới, mọi muộn phiền sẽ nhẹ nhàng tan biến,
                  nhường chỗ cho sự bình yên và hạnh phúc giản đơn. Du lịch là liều thuốc cho tâm hồn,
                  giúp ta nhận ra rằng cuộc sống này đẹp đẽ biết bao khi ta biết dừng lại, lắng nghe và tận hưởng.
                </p>
              </div>
            </Col>
            <Col lg="2">
              <div className="hero_img-box">
                <img src={heroImg} alt="" />
              </div>
            </Col>
            <Col lg="2">
              <div className="hero_img-box">
                <video src={heroVideo} alt="" controls />
              </div>
            </Col>
            <Col lg="2">
              <div className="hero_img-box">
                <img src={heroImg02} alt="" />
              </div>
            </Col>
            <SearchBar />
          </Row>
        </Container>
      </section>

      {/* Section: Dịch Vụ */}
      <section>
        <Container>
          <Row>
            <Col lg="3">
              <h5 className="services__subtitle">Chúng Tôi Cung Cấp</h5>
              <h2 className="services__title">Những Dịch Vụ Tốt Nhất Của Chúng Tôi</h2>
            </Col>
            <ServiceList />
          </Row>
        </Container>
      </section>

      {/* Section: Tour Nổi Bật */}
      <section>
        <Container>
          <Row>
            <Col lg="12" className="mb-5">
              <h2 className="featured_tour-title">Những Tour Du Lịch Của Chúng Tôi</h2>
            </Col>
            <FeaturedTourList />
          </Row>
        </Container>
      </section>

      {/* Section: Kinh Nghiệm */}
      <section>
        <Container>
          <Row>
            <Col lg="6">
              <div className="experience_content">
                <h5 className="services__subtitle">Kinh nghiệm</h5>
                <h2 className="services__title">
                  Bằng tất cả kinh nghiệm dày dặn, chúng tôi cam kết mang đến dịch vụ tận tâm và chuyên nghiệp nhất.
                </h2>
              </div>
              <div className="counter_wrapper d-flex align-items-center gap-5">
                <div className="counter_box">
                  <span>12k+</span>
                  <h6>Successful Trip</h6>
                </div>
                <div className="counter_box">
                  <span>2k+</span>
                  <h6>Regular clients</h6>
                </div>
                <div className="counter_box">
                  <span>15</span>
                  <h6>Years experience</h6>
                </div>
              </div>
            </Col>
            <Col lg="6">
              <div className="experience__img">
                <img src={experienceImg} alt="" />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Section: Bộ sưu tập ảnh */}
      <section>
        <Container>
          <Row>
            <Col lg="12">
              <h5 className="services__subtitle">Bộ sưu tập ảnh</h5>
              <h2 className="services__title">Khám phá những khoảnh khắc đáng nhớ trong hành trình của khách hàng đã tin tưởng lựa chọn chúng tôi.</h2>
            </Col>
            <Col lg="12">
              <MasonryImagesGallery />
            </Col>
          </Row>
        </Container>
      </section>

      {/* Section: Fans Yêu Thích */}
      <section>
        <Container>
          <Row>
            <Col lg="12">
              <h5 className="services__subtitle">Fans Yêu Thích</h5>
              <h2 className="services__title">What our fans say about us</h2>
            </Col>
            <Col lg="12">
              <Testimonials />
            </Col>
          </Row>
        </Container>
      </section>

      <Newsletter />
    </>
  );
};

export default Home;
