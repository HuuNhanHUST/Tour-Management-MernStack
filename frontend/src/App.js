import "./App.css";
import Layout from "./components/layout/layout";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import { Routes, Route } from "react-router-dom";

import PaymentHistory from "./pages/PaymentHistory"; // ✅ Import trang mới

function App() {
  const { user } = useContext(AuthContext);

  console.log("✅ User trong App.js:", user); // Debug nếu cần

  return (
    <Routes>
      <Route path="/*" element={<Layout />} />
      <Route path="/payment-history" element={<PaymentHistory />} /> {/* ✅ Bổ sung route */}
    </Routes>
  );
}

export default App;
