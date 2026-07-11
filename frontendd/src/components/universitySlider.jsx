

import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import { motion } from "framer-motion";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import manipal from "../assets/manipal.webp";
import dypatil from "../assets/dypatil.webp";
import mangalayatan from "../assets/mangalayatan.webp"
import amity_light from "../assets/amity_light.png"
import ignou_light from "../assets/ignou_light.png" 
import mangalayatan_light from "../assets/mangalayatan_light.png"
import manipal_light from "../assets/manipal_light.png"
import dypatil_light from "../assets/dypatil_light.png"


const UniversitySlider = () => {
  // Initialize theme from localStorage immediately to prevent flash
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true; // Default to dark if no preference
  });

  useEffect(() => {
    // Listen for theme changes
    const handleThemeChange = (event) => {
      setIsDarkMode(event.detail.isDarkMode);
    };

    window.addEventListener('themeChanged', handleThemeChange);
    
    // Theme is already initialized in useState, no need to load again

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);
  const items = [
    {
      id: 1,
      name: "Amity University",
      logo: "https://www.amity.edu/images/logo.png",
      website: "https://amityonline.com/",
      courses: "7+ Courses",
      students: "12k+ Students",
      teachers: "8+ Teachers",
    },
    {
      id: 2,
      name: "IGNOU",
      logo: "https://ignouadmission.samarth.edu.in/assets/a74f1fcdb316b6bf926c620666d81788/site_files/logo-light.png",
      website: "https://www.ignou.ac.in/",
      courses: "10+ Courses",
      students: "20k+ Students",
      teachers: "15+ Teachers",
    },
    {
      id: 3,
      name: "mangalayatan university",
      logo: mangalayatan,
      website: "https://www.muonline.ac.in/",
      courses: "12+ Courses",
      students: "18k+ Students",
      teachers: "20+ Teachers",
    },
    {
      id: 4,
      name: "Manipal University",
      logo: manipal,
      website: "https://www.manipal.edu/",
      courses: "15+ Courses",
      students: "25k+ Students",
      teachers: "30+ Teachers",
    },
    {
      id: 5,
      name: "DY Patil University",
      logo: dypatil,
      website: "https://www.dypatiledu.com/dypatil-university-online-education-mba-cta?source=DYPatil&media=IGAW&campaign=S-BRND-D&utm_source=Google&utm_Medium=Search&utm_campaign=15590069933&utm_adgroup=128498308502&utm_term=Dy%20patil%20online&utm_device=c&match_type=p&city=9184819&state=&gad_source=1&gad_campaignid=15590069933&gbraid=0AAAAAoOHAZOBR_kSHmV7HRHZoukm82s8y&gclid=CjwKCAjwlt7GBhAvEiwAKal0cn1VhdTGj-mefvEfb7DnrzLUOeuPfzKK4gwaTr9d_QJ2UmGUZalNZBoCezAQAvD_BwE#",
      courses: "9+ Courses",
      students: "10k+ Students",
      teachers: "12+ Teachers",
    },
  ];

  const logoLight=[
    {
      id: 1,
      name: "Amity University",
      logo: amity_light,
      website: "https://amityonline.com/",
      courses: "7+ Courses",
      students: "12k+ Students",
      teachers: "8+ Teachers",
    },
    {
      id: 2,
      name: "IGNOU",
      logo: ignou_light,
      website: "https://www.ignou.ac.in/",
      courses: "10+ Courses",
      students: "20k+ Students",
      teachers: "15+ Teachers",
    },
    {
      id: 3,
      name: "mangalayatan university",
      logo: mangalayatan_light,
      website: "https://www.muonline.ac.in/",
      courses: "12+ Courses",
      students: "18k+ Students",
      teachers: "20+ Teachers",
    },
    {
      id: 4,
      name: "Manipal University",
      logo: manipal_light,
      website: "https://www.manipal.edu/",
      courses: "15+ Courses",
      students: "25k+ Students",
      teachers: "30+ Teachers",
    },
    {
      id: 5,
      name: "DY Patil University",
      logo: dypatil_light,
      website: "https://www.dypatiledu.com/dypatil-university-online-education-mba-cta?source=DYPatil&media=IGAW&campaign=S-BRND-D&utm_source=Google&utm_Medium=Search&utm_campaign=15590069933&utm_adgroup=128498308502&utm_term=Dy%20patil%20online&utm_device=c&match_type=p&city=9184819&state=&gad_source=1&gad_campaignid=15590069933&gbraid=0AAAAAoOHAZOBR_kSHmV7HRHZoukm82s8y&gclid=CjwKCAjwlt7GBhAvEiwAKal0cn1VhdTGj-mefvEfb7DnrzLUOeuPfzKK4gwaTr9d_QJ2UmGUZalNZBoCezAQAvD_BwE#",
      courses: "9+ Courses",
      students: "10k+ Students",
      teachers: "12+ Teachers",
    }
  ]

  // Determine slidesToShow based on actual viewport (hard override for phones)
  const [slidesToShow, setSlidesToShow] = useState(3);
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w <= 640) setSlidesToShow(1);
      else if (w <= 1024) setSlidesToShow(2);
      else setSlidesToShow(3);
    };
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('orientationchange', compute);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('orientationchange', compute);
    };
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 2800,
    pauseOnHover: false,
    pauseOnFocus: false,
    swipeToSlide: true,
    touchThreshold: 12,
    cssEase: 'ease-out',
    adaptiveHeight: false,
    // Breakpoints are max-width by default
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 3, arrows: false } },
      { breakpoint: 1024, settings: { slidesToShow: 2, arrows: false } },
      { breakpoint: 768, settings: { slidesToShow: 1, arrows: false, centerMode: true, centerPadding: '20px' } },
      { breakpoint: 640, settings: { slidesToShow: 1, arrows: false, centerMode: true, centerPadding: '16px' } },
    ],
  };

  // Force slick to recalc on mount (fixes some mobile viewport quirks)
  useEffect(() => {
    const id = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
    return () => clearTimeout(id);
  }, []);

  // Pick dataset based on theme
  const data = isDarkMode ? items : logoLight;

  return (
    <div className="mx-auto px-4 py-6 max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl">
      <Slider key={`slides-${slidesToShow}`} {...settings}>
        {data.map((item) => (
          <div key={item.id} className="px-2">
            <div className={`relative group shadow-lg rounded-xl overflow-hidden h-24 md:h-28 transition-colors duration-300 ${
              isDarkMode ? 'bg-black' : 'bg-gray-300'
            }`}>
              {/* Centered content wrapper for perfect vertical alignment */}
              <div className="h-full w-full flex items-center justify-center p-4">
                {/* Logo */}
                <img
                  src={item.logo}
                  alt={item.name}
                  className="max-h-full max-w-full object-contain"
                  style={item.name === 'Amity University' ? (isDarkMode ? { maxHeight: '40%' } : { maxHeight: '80%' }) : undefined}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                
                {/* Fallback text if logo fails to load */}
                <div className={`hidden h-full w-full items-center justify-center text-sm font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {item.name}
                </div>
              </div>

             {/* Overlay on hover */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileHover={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
  className="absolute inset-0 bg-black bg-opacity-85 flex flex-col justify-center items-center text-white p-3"
>
  {/* University details */}
  <div className="space-y-1 text-center">
    <p className="text-xs font-medium">
      <span className="text-white">{item.courses}</span>
    </p>
    <p className="text-xs font-medium">
      <span className="text-white">{item.students}</span>
    </p>
    <p className="text-xs font-medium">
      <span className="text-white">{item.teachers}</span>
    </p>
  </div>

  {/* Bottom link */}
  <a
    href={item.website}
    target="_blank"
    rel="noreferrer"
    className="mt-3 text-sm font-bold underline decoration-white/40 decoration-1 underline-offset-2 hover:text-emerald-300 transition-colors"
  >
    {item.name}
  </a>
</motion.div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default UniversitySlider;
