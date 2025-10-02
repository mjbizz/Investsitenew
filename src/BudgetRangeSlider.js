import React, { useState, useRef, useEffect, useCallback } from 'react';

const BudgetRangeSlider = ({ 
  minValue = 0, 
  maxValue = 1000000, 
  step = 1000, // Reduced step size for smoother dragging
  currentMin = 0,
  currentMax = 1000000,
  onRangeChange 
}) => {
  const [min, setMin] = useState(currentMin);
  const [max, setMax] = useState(currentMax);
  const [isDragging, setIsDragging] = useState(null);
  const isDraggingRef = useRef(null); // Immediate ref for drag detection
  const sliderRef = useRef(null);
  const minHandleRef = useRef(null);
  const maxHandleRef = useRef(null);
  const lastUpdateTime = useRef(0);
  const minRef = useRef(min);
  const maxRef = useRef(max);

  // Update internal state when props change (but only if we're not dragging)
  useEffect(() => {
    if (!isDraggingRef.current) {
      setMin(currentMin);
      setMax(currentMax);
    }
  }, [currentMin, currentMax]);

  // Keep refs in sync with state
  useEffect(() => {
    minRef.current = min;
    maxRef.current = max;
  }, [min, max]);

  const formatCurrency = (value) => {
    if (value === minValue) return 'No min';
    if (value === maxValue) return 'No max';
    return `$${(value / 1000).toFixed(0)}k`;
  };

  const getPercentage = (value) => {
    return ((value - minValue) / (maxValue - minValue)) * 100;
  };

  const getValueFromPosition = (clientX) => {
    if (!sliderRef.current) return minValue;
    
    const rect = sliderRef.current.getBoundingClientRect();
    let percentage = ((clientX - rect.left) / rect.width) * 100;
    percentage = Math.max(0, Math.min(100, percentage)); // Clamp between 0-100
    
    // Calculate the exact value
    const exactValue = minValue + (percentage / 100) * (maxValue - minValue);
    
    // Always return the exact value for smooth dragging
    return exactValue;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    updateValue(e.clientX);
  };

  // Define updateValue first before other functions that use it
  const updateValue = useCallback((clientX) => {
    if (!isDraggingRef.current) return;
    
    const newValue = getValueFromPosition(clientX);
    
    if (isDraggingRef.current === 'min') {
      const clampedValue = Math.min(Math.max(minValue, newValue), maxRef.current - step);
      setMin(clampedValue);
    } else if (isDraggingRef.current === 'max') {
      const clampedValue = Math.max(Math.min(maxValue, newValue), minRef.current + step);
      setMax(clampedValue);
    }
  }, [minValue, maxValue, step]);

  const handleMouseDown = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set dragging state immediately for instant visual feedback
    isDraggingRef.current = type;
    setIsDragging(type);
    
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('selectstart', preventSelection);
  };

  const handleTouchMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    
    // Direct update without requestAnimationFrame to avoid double RAF
    if (e.touches && e.touches[0]) {
      updateValue(e.touches[0].clientX);
    }
  }, [updateValue]);

  const preventSelection = useCallback((e) => {
    e.preventDefault();
    return false;
  }, []);

  // Track pending updates to avoid unnecessary renders
  const pendingUpdate = useRef({ min: null, max: null });
  const isMounted = useRef(false);

  // Call onRangeChange when min or max changes
  useEffect(() => {
    if (isMounted.current && onRangeChange) {
      onRangeChange({
        min: min,
        max: max
      });
    }
  }, [min, max, onRangeChange]);

  // Set isMounted to true after initial render
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handle touch end events
  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    
    // Clear dragging state
    isDraggingRef.current = null;
    setIsDragging(null);
    
    // Remove event listeners
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    document.removeEventListener('touchcancel', handleTouchEnd);
    document.removeEventListener('selectstart', preventSelection);
    
    // The onRangeChange will be called by the useEffect hook
  }, [handleTouchMove, preventSelection]);

  // Handle mouse up events
  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = null;
    setIsDragging(null);
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('selectstart', preventSelection);
    
    // Call the callback with final values using refs to avoid dependency issues
    if (onRangeChange) {
      onRangeChange({
        min: minRef.current,
        max: maxRef.current
      });
    }
  }, [handleMouseMove, onRangeChange, preventSelection]);
  
  // Helper function to handle touch start
  const handleTouchStart = useCallback((e, type) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = type;
    setIsDragging(type);
    
    // Add event listeners for touch move/end
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    document.addEventListener('selectstart', preventSelection, { passive: false });
  }, [handleTouchMove, handleTouchEnd, preventSelection]);
  
  // Helper function to handle slider touch start
  const handleSliderTouchStart = useCallback((e) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percent = x / rect.width;
    const value = minValue + percent * (maxValue - minValue);
    
    // Determine which handle is closer using refs to avoid dependency issues
    const minDist = Math.abs(value - minRef.current);
    const maxDist = Math.abs(value - maxRef.current);
    
    const type = minDist < maxDist ? 'min' : 'max';
    handleTouchStart(e, type);
    
    // Update the value immediately
    updateValue(e.touches[0].clientX);
  }, [minValue, maxValue, handleTouchStart, updateValue]);

  // Add direct DOM touch event listeners to avoid passive event issues
  useEffect(() => {
    const minHandle = minHandleRef.current;
    const maxHandle = maxHandleRef.current;
    const slider = sliderRef.current;

    // Create handler functions that can be properly removed
    const minTouchHandler = (e) => handleTouchStart(e, 'min');
    const maxTouchHandler = (e) => handleTouchStart(e, 'max');

    // Add touch event listeners
    if (minHandle) {
      minHandle.addEventListener('touchstart', minTouchHandler, { passive: false });
    }
    if (maxHandle) {
      maxHandle.addEventListener('touchstart', maxTouchHandler, { passive: false });
    }
    if (slider) {
      slider.addEventListener('touchstart', handleSliderTouchStart, { passive: false });
    }

    // Cleanup function
    return () => {
      if (minHandle) {
        minHandle.removeEventListener('touchstart', minTouchHandler);
      }
      if (maxHandle) {
        maxHandle.removeEventListener('touchstart', maxTouchHandler);
      }
      if (slider) {
        slider.removeEventListener('touchstart', handleSliderTouchStart);
      }
      
      // Clean up global event listeners
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
      document.removeEventListener('selectstart', preventSelection);
    };
  }, [handleTouchStart, handleSliderTouchStart, handleTouchMove, handleTouchEnd, preventSelection]);

  const handleSliderClick = (e) => {
    if (isDragging) return;
    
    const newValue = getValueFromPosition(e.clientX);
    const minDistance = Math.abs(newValue - minRef.current);
    const maxDistance = Math.abs(newValue - maxRef.current);
    
    if (minDistance < maxDistance) {
      const newMin = Math.max(minValue, Math.min(newValue, maxRef.current - step));
      setMin(newMin);
      if (onRangeChange) {
        onRangeChange({
          min: newMin,
          max: maxRef.current
        });
      }
    } else {
      const newMax = Math.min(maxValue, Math.max(newValue, minRef.current + step));
      setMax(newMax);
      if (onRangeChange) {
        onRangeChange({
          min: minRef.current,
          max: newMax
        });
      }
    }
  };

  return (
    <div style={{ width: '100%', padding: '8px 0' }}>
      {/* Value display */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '12px',
        fontSize: '12px',
        color: '#e2e8f0'
      }}>
        <span style={{ color: '#10b981', fontWeight: '600' }}>
          {formatCurrency(min)}
        </span>
        <span style={{ color: '#3b82f6', fontWeight: '600' }}>
          {formatCurrency(max)}
        </span>
      </div>

      {/* Slider track - Redfin style */}
      <div
        ref={sliderRef}
        style={{
          position: 'relative',
          height: '6px',
          backgroundColor: '#e9e9e9',
          borderRadius: '3px',
          margin: '20px 0',
          cursor: 'pointer'
        }}
        onClick={handleSliderClick}
      >
        {/* Active range */}
        <div
          style={{
            position: 'absolute',
            left: `${getPercentage(min)}%`,
            width: `${getPercentage(max) - getPercentage(min)}%`,
            height: '100%',
            backgroundColor: '#3b82f6',
            borderRadius: '3px'
          }}
        />

        {/* Min handle - smaller, cleaner style with larger touch area */}
        <div
          ref={minHandleRef}
          style={{
            position: 'absolute',
            left: `${getPercentage(min)}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: isDragging === 'min' ? 20 : 10,
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
          onMouseDown={(e) => handleMouseDown(e, 'min')}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: '#ffffff',
              border: '2px solid #3b82f6',
              borderRadius: '50%',
              cursor: isDragging === 'min' ? 'grabbing' : 'grab',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: isDragging === 'min' ? 'none' : 'all 0.1s ease',
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* Max handle - smaller, cleaner style with larger touch area */}
        <div
          ref={maxHandleRef}
          style={{
            position: 'absolute',
            left: `${getPercentage(max)}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: isDragging === 'max' ? 20 : 10,
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
          onMouseDown={(e) => handleMouseDown(e, 'max')}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: '#ffffff',
              border: '2px solid #3b82f6',
              borderRadius: '50%',
              cursor: isDragging === 'max' ? 'grabbing' : 'grab',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: isDragging === 'max' ? 'none' : 'all 0.1s ease',
              pointerEvents: 'none'
            }}
          />
        </div>
      </div>

      {/* Range labels */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: '8px',
        fontSize: '10px',
        color: '#94a3b8'
      }}>
        <span>$0</span>
        <span>$1M+</span>
      </div>
    </div>
  );
};

export default BudgetRangeSlider;
