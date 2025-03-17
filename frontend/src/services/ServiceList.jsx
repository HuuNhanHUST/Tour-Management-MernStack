import React from "react";
import ServiceCard from "./ServiceCard";
import { Col } from "reactstrap";

import weatherImg from "../assets/images/weather.png";
import guideImg from "../assets/images/guide.png";
import customizationImg from "../assets/images/customization.png";

const servicesData = [
    {
        imgUrl: weatherImg,
        title: "Tính Toán Thời Tiết",
        desc: "Dự báo thời tiết chính xác và cập nhật liên tục.",
    },
    {
        imgUrl: guideImg,
        title: "Hướng Dẫn Viên Du Lịch Tốt Nhất",
        desc: "Đội ngũ hướng dẫn viên chuyên nghiệp, nhiệt tình.",
    },
    {
        imgUrl: customizationImg,
        title: "Tùy Chỉnh",
        desc: "Tùy chỉnh dịch vụ theo nhu cầu cá nhân của bạn.",
    },
];

const ServiceList = () => {
    return (
        <>
            {servicesData.map((item, index) => (
                <Col lg="3" key={index}>
                    <ServiceCard item={item} />
                </Col>
            ))}
        </>
    );
};

export default ServiceList;
