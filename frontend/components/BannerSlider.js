import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { useState, useRef } from 'react';
import { getImageUrl } from '../lib/utils';

export default function BannerSlider({ banners }) {
  return (
    <Swiper
      modules={[Autoplay, Pagination]}
      spaceBetween={0}
      slidesPerView={1}
      autoplay={{ delay: 5000 }}
      pagination={{ clickable: true }}
      className="my-4"
    >
      {banners.map(banner => (
        <SwiperSlide key={banner._id}>
          {banner.image ? (
            <img src={getImageUrl(banner.image)} alt={banner.title} className="unifiedImage" />
          ) : (
            <video src={getImageUrl(banner.video)} className="unifiedImage" controls autoPlay muted loop playsInline />
          )}
        </SwiperSlide>
      ))}
    </Swiper>
  );
}