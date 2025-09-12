import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Home from '../pages/home';
import Tour from '../pages/Tour';
import About from "../pages/About";
import TourDetails from '../pages/TourDetails';
import Login from '../pages/Login';
import Register from '../pages/Register';
import SearchResultList from '../pages/SearchResultList';
import ThankYou from '../pages/ThankYou';
import SavedTours from '../pages/SavedTours';
import PaymentHistory from '../pages/PaymentHistory';

const Routers = () => {
  return (
    <Routes>
       <Route path="/" element={<Navigate to="/home" />} />
      <Route path="/home" element={<Home />} />
      <Route path='/tour' element={<Tour />} />
      <Route path="/about" element={<About />} />
      <Route path='/tour/:id' element={<TourDetails />} />
      <Route path='/login' element={<Login />} />
      <Route path='/register' element={<Register />} />
      <Route path='/thank-you' element={<ThankYou />} />
      <Route path='/tours/search' element={<SearchResultList />} />
      <Route path="/saved-tours" element={<SavedTours />} />
      <Route path="/payment-history" element={<PaymentHistory />} />
    </Routes>
  );
};

export default Routers;
