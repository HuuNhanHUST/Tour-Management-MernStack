import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import TourCard from "../shared/TourCard";

const SavedTours = () => {
  const { user } = useContext(AuthContext);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const fetchFavorites = async () => {
      const res = await fetch(`http://localhost:4000/api/v1/users/${user._id}/favorites`);
      const data = await res.json();
      setFavorites(data.favorites);
    };
    if (user) fetchFavorites();
  }, [user]);

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Tour yêu thích của bạn</h2>  
      <div className="row">
        {favorites.map((tour) => (
          <div className="col-lg-3 col-md-4 col-sm-6 mb-4" key={tour._id}>
            <TourCard tour={tour} />
          </div>
        ))}
      </div>
    </div>
  );
  
};

export default SavedTours;
