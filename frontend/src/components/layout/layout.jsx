import React from "react";

import Header from "../header/header";
import Routers from "../../router/Routers";
import Footer from "../footer/footer";

const Layout = () => {
  return (
    <>
      <Header />
      <Routers/>
      <Footer />
    </>
  );
};

export default Layout;
