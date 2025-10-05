import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we should scroll to tools section on page load
    if (window.location.hash === '#tools') {
      setTimeout(() => {
        const toolsSection = document.getElementById('tools');
        if (toolsSection) {
          toolsSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100); // Small delay to ensure page is fully rendered
    }

    // Smooth scroll for navigation
    const anchors = document.querySelectorAll('a[href^="#"]');
    anchors.forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    // Parallax scroll effects
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const orbs = document.querySelectorAll('.orb');
      const shapes = document.querySelectorAll('.floating-shape');
      
      orbs.forEach((orb, index) => {
        const speed = 0.3 * (index + 1);
        orb.style.transform = `translateY(${scrolled * speed}px)`;
      });
      
      shapes.forEach((shape, index) => {
        const speed = 0.2 * (index + 1);
        shape.style.transform = `translateY(${scrolled * speed}px) rotate(${scrolled * 0.1}deg)`;
      });
    };

    // Mouse move effects for enhanced interactivity
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      
      const orb1 = document.querySelector('.orb-1');
      const orb2 = document.querySelector('.orb-2');
      const orb3 = document.querySelector('.orb-3');
      
      if (orb1) orb1.style.transform = `translate(${x * 0.05}px, ${y * 0.05}px)`;
      if (orb2) orb2.style.transform = `translate(${x * -0.03}px, ${y * 0.03}px)`;
      if (orb3) orb3.style.transform = `translate(${x * 0.02}px, ${y * -0.02}px)`;
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const openTool = (toolName, event) => {
    const card = event.currentTarget;
    
    // Create ripple effect
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(0, 255, 157, 0.3)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s linear';
    ripple.style.left = '50%';
    ripple.style.top = '50%';
    ripple.style.width = '20px';
    ripple.style.height = '20px';
    ripple.style.marginLeft = '-10px';
    ripple.style.marginTop = '-10px';
    
    const icon = card.querySelector('.tool-icon');
    card.appendChild(ripple);
    
    // Icon pulse effect
    if (icon) {
      icon.style.transform = 'scale(1.2)';
      icon.style.filter = 'brightness(1.5)';
    }
    
    setTimeout(() => {
      if (icon) {
        icon.style.transform = 'scale(1.1)';
        icon.style.filter = 'brightness(1)';
      }
      ripple.remove();
      
      // Navigate to tool
      if (toolName === 'investment-finder') {
        navigate('/investment-finder');
      } else if (toolName === 'buying-power') {
        navigate('/buying-power');
      } else if (toolName === 'roi-calculator') {
        navigate('/roi-calculator');
      } else if (toolName === 'property-search') {
        navigate('/property-search');
      } else {
        console.log(`Opening ${toolName}...`);
        alert(`🚀 Opening ${toolName.replace('-', ' ').toUpperCase()}`);
      }
    }, 300);
  };

  return (
    <div className="homepage">
      <div className="grid-bg"></div>
      
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      <div className="floating-shape shape-1"></div>
      <div className="floating-shape shape-2"></div>
      <div className="floating-shape shape-3"></div>

      <header>
        <nav>
          <div className="logo">Proper Invest Model</div>
          <ul className="nav-links">
            <li><a href="#tools">Tools</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
      </header>

      <section className="tools-section" id="tools">
        <div className="tools-grid">
          <div className="tool-card" onClick={(e) => openTool('buying-power', e)}>
            <div className="tool-icon">💰</div>
            <h3>Buying Power</h3>
            <p>Calculate your maximum purchase capacity</p>
          </div>

          <div className="tool-card" onClick={(e) => openTool('investment-finder', e)}>
            <div className="tool-icon">🎯</div>
            <h3>Investment Finder</h3>
            <p>Discover the right investment strategy</p>
          </div>

          <div className="tool-card" onClick={(e) => openTool('roi-calculator', e)}>
            <div className="tool-icon">📈</div>
            <h3>ROI Calculator</h3>
            <p>Analyze potential returns and profits</p>
          </div>

          <div className="tool-card" onClick={(e) => openTool('property-search', e)}>
            <div className="tool-icon">🏠</div>
            <h3>Property Search</h3>
            <p>Find high-potential investment properties</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
