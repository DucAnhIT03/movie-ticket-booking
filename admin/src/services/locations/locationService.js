import axios from "axios";

const API_BASE = "https://provinces.open-api.vn/api";

const locationService = {
  async getProvinces() {
    const res = await axios.get(`${API_BASE}/p/`);
    return res.data || [];
  },

  async getDistricts(provinceCode) {
    if (!provinceCode) return [];
    const res = await axios.get(`${API_BASE}/p/${provinceCode}?depth=2`);
    return res.data?.districts || [];
  },

  async getWards(districtCode) {
    if (!districtCode) return [];
    const res = await axios.get(`${API_BASE}/d/${districtCode}?depth=2`);
    return res.data?.wards || [];
  },
};

export default locationService;

