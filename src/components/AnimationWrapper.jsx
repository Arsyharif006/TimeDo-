// src/components/AnimationWrapper.jsx
import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Komponen wrapper untuk menambahkan animasi
const AnimationWrapper = ({ children, animation = 'fade-up', delay = 0 }) => {
  useEffect(() => {
    // Initialize AOS
    AOS.init({
      duration: 800,
      once: false,
      mirror: true,
    });
  }, []);

  return (
    <div data-aos={animation} data-aos-delay={delay}>
      {children}
    </div>
  );
};

export default AnimationWrapper;