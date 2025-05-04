import "./App.css";
import Layout from "./components/layout/layout";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

function App() {
  const { user } = useContext(AuthContext);

  console.log("✅ User trong App.js:", user); // Debug nếu cần

  // Optional: Show loading nếu cần, hoặc để yên như dưới
  return <Layout />;
}

export default App;
