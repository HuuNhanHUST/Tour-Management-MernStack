import React from 'react';
import Slider from 'react-slick';
import ava01 from '../../assets/images/ava-1.jpg';
import ava02 from '../../assets/images/ava-2.jpg';
import ava03 from '../../assets/images/ava-3.jpg';

const Testimonials = () => {
  const settings = {
    dots: true,              // Hiển thị dấu chấm điều hướng
    infinite: true,          // Vòng lặp vô hạn
    speed: 500,              // Tốc độ trượt
    slidesToShow: 2,         // Hiển thị 2 comment trên mỗi slide
    slidesToScroll: 1,       // Lướt từng comment một
    autoplay: true,          // Tự động chạy
    autoplaySpeed: 3000,     // Mỗi 3s trượt một lần
    responsive: [
      {
        breakpoint: 992, // Khi màn hình dưới 992px (tablet)
        settings: {
          slidesToShow: 1, // Chỉ hiển thị 1 comment
          slidesToScroll: 1
        }
      }
    ]
  };

  return (
    <Slider {...settings}>
      {/* Comment 1 */}
      <div className="testimonial py-4 px-3">
        <div className="d-flex align-items-center gap-4 mb-3">
          <img src={ava01} className="w-25 h-25 rounded-2" alt="Avatar 1" />
          <div>
            <h5 className="mb-0">John Doe</h5>
            <p>Khách hàng</p>
          </div>
        </div>
        <p>
          "Dịch vụ tuyệt vời! Mình đã có một chuyến đi đáng nhớ, cảm ơn đội ngũ rất nhiều."
        </p>
      </div>

      {/* Comment 2 */}
      <div className="testimonial py-4 px-3">
        <div className="d-flex align-items-center gap-4 mb-3">
          <img src={ava02} className="w-25 h-25 rounded-2" alt="Avatar 2" />
          <div>
            <h5 className="mb-0">Jane Smith</h5>
            <p>Khách hàng</p>
          </div>
        </div>
        <p>
          "Tour được tổ chức rất chuyên nghiệp, hướng dẫn viên nhiệt tình và hiểu biết sâu rộng."
        </p>
      </div>

      {/* Comment 3 */}
      <div className="testimonial py-4 px-3">
        <div className="d-flex align-items-center gap-4 mb-3">
          <img src={ava03} className="w-25 h-25 rounded-2" alt="Avatar 3" />
          <div>
            <h5 className="mb-0">David Wilson</h5>
            <p>Khách hàng</p>
          </div>
        </div>
        <p>
          "Chuyến đi này thực sự đã thay đổi góc nhìn của mình về du lịch. Mọi thứ rất tuyệt!"
        </p>
      </div>

      {/* Thêm nhiều comment khác nếu cần */}
    </Slider>
  );
};

export default Testimonials;
