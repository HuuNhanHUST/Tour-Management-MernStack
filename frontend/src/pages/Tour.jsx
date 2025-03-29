import React, { useState, useEffect } from 'react';
import CommonSection from '../shared/CommonSection';
import SearchBar from '../shared/SearchBar';
import TourCard from '../shared/TourCard';
import Newsletter from '../shared/Newsleter';
import { Container, Row, Col } from 'reactstrap';
import useFetch from '../hooks/useFetch';
import { BASE_URL } from '../utils/config';

const Tour = () => {
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(0);

  // ✅ Gọi API lấy tour theo page
  const {
    data: tours,
    loading,
    error,
  } = useFetch(`${BASE_URL}/tour?page=${page}`);

  const { data: tourCount } = useFetch(`${BASE_URL}/tour/search/getTourCount`);

  useEffect(() => {
    const pages = Math.ceil(tourCount / 8); // mỗi trang 8 tour
    setPageCount(pages);
    window.scrollTo(0,0)
  }, [page,tourCount]);

  return (
    <>
      <CommonSection title="Toàn Bộ Tours" />

      <section>
        <Container>
          <Row>
            <SearchBar />
          </Row>
        </Container>
      </section>

      <section className="pt-0">
        <Container>
          {loading && <h4 className='text-center pt-5'>Đang tải dữ liệu...</h4>}
          {error && <h4 className='text-center pt-5'>{error}</h4>}

          {!loading && !error && (
            <Row>
              {tours?.map((tour) => (
                <Col lg="3" className="mb-4" key={tour._id}>
                  <TourCard tour={tour} />
                </Col>
              ))}

              <Col lg="12">
                <div className="pagination d-flex align-items-center justify-content-center mt-4 gap-3">
                  {[...Array(pageCount).keys()].map((number) => (
                    <span
                      key={number}
                      onClick={() => setPage(number)}
                      className={page === number ? 'active__page' : ''}
                      style={{ cursor: 'pointer' }}
                    >
                      {number + 1}
                    </span>
                  ))}
                </div>
              </Col>
            </Row>
          )}
        </Container>
      </section>

      <Newsletter />
    </>
  );
};

export default Tour;
