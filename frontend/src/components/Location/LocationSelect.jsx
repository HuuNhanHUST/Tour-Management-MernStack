import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../utils/config.js";

const LocationSelect = ({ onChange }) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");

  // Log khi selectedProvince thay đổi
  useEffect(() => {
    console.log("selectedProvince changed:", selectedProvince);
  }, [selectedProvince]);

  // Log khi selectedDistrict thay đổi
  useEffect(() => {
    console.log("selectedDistrict changed:", selectedDistrict);
  }, [selectedDistrict]);

  // Log khi selectedWard thay đổi
  useEffect(() => {
    console.log("selectedWard changed:", selectedWard);
  }, [selectedWard]);

  // Lấy danh sách tỉnh khi mount component
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/location/provinces`);
        setProvinces(res.data);
      } catch (error) {
        console.error("Lấy tỉnh thất bại", error);
      }
    };
    fetchProvinces();
  }, []);

  // Khi chọn tỉnh, load danh sách huyện tương ứng
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setSelectedDistrict("");
      return;
    }
    const fetchDistricts = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/location/districts/${selectedProvince}`);
        setDistricts(res.data);
      } catch (error) {
        console.error("Lấy huyện thất bại", error);
      }
    };
    fetchDistricts();
  }, [selectedProvince]);

  // Khi chọn huyện, load danh sách xã tương ứng
  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      setSelectedWard("");
      return;
    }
    const fetchWards = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/location/wards/${selectedDistrict}`);
        setWards(res.data);
      } catch (error) {
        console.error("Lấy xã thất bại", error);
      }
    };
    fetchWards();
  }, [selectedDistrict]);

  // Gửi dữ liệu địa chỉ lên component cha khi có thay đổi
  useEffect(() => {
    const provObj = provinces.find(p => String(p.code) === String(selectedProvince)) || { code: "", name: "" };
    const distObj = districts.find(d => String(d.code) === String(selectedDistrict)) || { code: "", name: "" };
    const wardObj = wards.find(w => String(w.code) === String(selectedWard)) || { code: "", name: "" };

    onChange({
      province: provObj,
      district: distObj,
      ward: wardObj,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvince, selectedDistrict, selectedWard]);

  return (
    <div className="location-select">
      <select
        value={selectedProvince}
        onChange={(e) => setSelectedProvince(e.target.value)}
        required
      >
        <option value="">-- Chọn tỉnh/thành --</option>
        {provinces.map((p) => (
          <option key={p.code} value={p.code}>
            {p.name}
          </option>
        ))}
      </select>

      <select
        value={selectedDistrict}
        onChange={(e) => setSelectedDistrict(e.target.value)}
        required
        disabled={!selectedProvince}
      >
        <option value="">-- Chọn quận/huyện --</option>
        {districts.map((d) => (
          <option key={d.code} value={d.code}>
            {d.name}
          </option>
        ))}
      </select>

      <select
        value={selectedWard}
        onChange={(e) => setSelectedWard(e.target.value)}
        required
        disabled={!selectedDistrict}
      >
        <option value="">-- Chọn xã/phường --</option>
        {wards.map((w) => (
          <option key={w.code} value={w.code}>
            {w.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LocationSelect;
