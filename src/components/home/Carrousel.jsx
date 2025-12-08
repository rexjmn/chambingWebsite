// src/components/Carrousel.jsx

import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import WorkerCard from '../WorkerCard';
import { workerService } from '../../services/workerService';
import '../../styles/components/Carrousel.scss';

const Carrousel = ({ workers, title = "Profesionales Destacados", subtitle }) => {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // 🔄 Verificar posición del scroll
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [workers]);

  // ⬅️ Scroll a la izquierda
  const scrollLeftHandler = () => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.querySelector('.worker-card-link')?.offsetWidth || 320;
      scrollContainerRef.current.scrollBy({
        left: -(cardWidth + 24), // card width + gap
        behavior: 'smooth'
      });
    }
  };

  // ➡️ Scroll a la derecha
  const scrollRightHandler = () => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.querySelector('.worker-card-link')?.offsetWidth || 320;
      scrollContainerRef.current.scrollBy({
        left: cardWidth + 24,
        behavior: 'smooth'
      });
    }
  };

  // 🖱️ Drag to scroll - Mouse Down
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    scrollContainerRef.current.style.cursor = 'grabbing';
  };

  // 🖱️ Drag to scroll - Mouse Leave/Up
  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  // 🖱️ Drag to scroll - Mouse Move
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Velocidad del scroll
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // 🛡️ Guard clause
  if (!workers || workers.length === 0) {
    return (
      <section className="carrousel-section">
        <div className="carrousel-container">
          <div className="carrousel-header">
            <h2 className="carrousel-title">{title}</h2>
          </div>
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p>No hay profesionales disponibles en este momento</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="carrousel-section">
      <div className="carrousel-container">
        {/* 📌 Header */}
        <div className="carrousel-header">
          <div className="header-content">
            <h2 className="carrousel-title">{title}</h2>
            {subtitle && <p className="carrousel-subtitle">{subtitle}</p>}
          </div>
          
          {/* 🎮 Controles de navegación */}
          <div className="carrousel-controls">
            <button
              className={`control-btn prev ${!canScrollLeft ? 'disabled' : ''}`}
              onClick={scrollLeftHandler}
              disabled={!canScrollLeft}
              aria-label="Anterior"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className={`control-btn next ${!canScrollRight ? 'disabled' : ''}`}
              onClick={scrollRightHandler}
              disabled={!canScrollRight}
              aria-label="Siguiente"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* 🎠 Carrousel */}
        <div 
          className="carrousel-wrapper"
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeaveOrUp}
          onMouseUp={handleMouseLeaveOrUp}
          onMouseMove={handleMouseMove}
        >
          <div className="carrousel-track">
            {workers.map((worker, index) => (
              <div 
                key={worker.id || index} 
                className="carrousel-item"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <WorkerCard worker={worker} />
              </div>
            ))}
          </div>
        </div>

        {/* 📊 Indicador de scroll */}
        <div className="scroll-indicator">
          <div 
            className="scroll-progress"
            style={{
              width: `${(scrollLeft / (scrollContainerRef.current?.scrollWidth - scrollContainerRef.current?.clientWidth || 1)) * 100}%`
            }}
          />
        </div>
      </div>
    </section>
  );
};

Carrousel.propTypes = {
  workers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
    })
  ).isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
};

export default Carrousel;
