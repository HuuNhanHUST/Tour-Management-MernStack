import React from 'react';
import '../styles/about.css';

import teamImg from '../assets/images/team.jpg';
import valueImg from '../assets/images/value-photo.jpg';
import certImg from '../assets/images/giayphep.jpg';
import awardImg from '../assets/images/award.jpg';

import member1 from '../assets/images/member1.jpg';
import member2 from '../assets/images/member2.jpg';
import member3 from '../assets/images/member3.jpg';

const teamMembers = [
  { name: 'Đoàn Hữu Nhân', mssv: '2280602159', img: member1 },
  { name: 'Nguyễn Hồng Thiên', mssv: '2280603035', img: member2 },
  { name: 'Trương Minh Mẫn', mssv: '2280601910', img: member3 },
];

const About = () => {
  return (
    <div className="about-page">

      {/* 🔹 1. Timeline thành lập */}
      <section className="section timeline-section">
        <div className="left">
          <h1>Giới Thiệu Chung</h1>
          <h2>Quá Trình Thành Lập Và Hoạt Động</h2>
          <ul className="timeline">
            <li><strong>1995 - 1999:</strong> Giai đoạn hình thành</li>
            <li><strong>1999 - 2016:</strong> Xây dựng hình ảnh</li>
            <li><strong>2016 - 2019:</strong> Khẳng định vị thế</li>
            <li><strong>2019 - 2022:</strong> Vượt qua đại dịch Covid</li>
            <li><strong>2022 - nay:</strong> Định hướng phát triển mới</li>
          </ul>
        </div>
        <div className="right">
          <img src={teamImg} alt="Đội ngũ công ty" />
        </div>
      </section>

      {/* 🔹 2. Mục đích & Giá trị */}
      <section className="section value-section">
        <div className="left">
          <img src={valueImg} alt="Mục đích và giá trị" />
        </div>
        <div className="right">
          <h2>Mục Đích Và Giá Trị</h2>
          <p><strong>Mục đích:</strong> Cải thiện đời sống tinh thần khách hàng qua dịch vụ chất lượng.</p>
          <p><strong>Giá trị:</strong> Tiên phong – Tự chủ – Chính trực – Quyết thắng.</p>
        </div>
      </section>

      {/* 🔹 3. Quản lý chất lượng */}
      <section className="section quality-section">
        <div className="left">
          <h2>Hệ Thống Quản Lý Chất Lượng</h2>
          <ul>
            <li>Tuyển dụng và đào tạo bài bản</li>
            <li>Giám sát dịch vụ khách hàng</li>
            <li>Đánh giá hiệu suất bằng KPI</li>
            <li>Tiếp nhận & cải thiện theo phản hồi</li>
          </ul>
        </div>
        <div className="right">
          <img src={certImg} alt="Giấy phép" />
        </div>
      </section>

      {/* 🔹 4. Thành tích */}
      <section className="section awards-section">
        <div className="left">
          <h2>Thành Tích - Giải Thưởng</h2>
          <ul className="timeline">
            <li><strong>2023:</strong> Top 10 doanh nghiệp du lịch hàng đầu</li>
            <li><strong>2019:</strong> Thương hiệu lữ hành tiêu biểu</li>
            <li><strong>2017:</strong> Bằng khen tích cực cộng đồng</li>
          </ul>
        </div>
        <div className="right">
          <img src={awardImg} alt="Giải thưởng" />
        </div>
      </section>

      {/* 🔹 5. Thành viên phát triển */}
      <section className="section team-section">
        <h2 className="section-title">🧑‍💻 Thành viên phát triển</h2>
        <div className="team-grid">
          {teamMembers.map((member, idx) => (
            <div className="team-card" key={idx}>
              <img src={member.img} alt={member.name} className="team-avatar" />
              <h4>{member.name}</h4>
              <p>MSSV: {member.mssv}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default About;
