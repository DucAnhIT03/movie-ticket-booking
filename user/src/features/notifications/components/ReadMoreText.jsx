import React, { useState, useRef, useEffect } from "react";
import "./ReadMoreText.css";

export default function ReadMoreText({ text, maxLines = 3, className = "" }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const textRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!text) {
      setShowReadMore(false);
      return;
    }

    
    const checkTextOverflow = () => {
      if (!textRef.current || !containerRef.current) return;

      if (!isExpanded) {
        
        textRef.current.classList.add('collapsed');
        textRef.current.classList.remove('expanded');
        
        
        requestAnimationFrame(() => {
          if (!textRef.current || !containerRef.current) return;
          
          const computedStyle = window.getComputedStyle(textRef.current);
          const lineHeight = parseFloat(computedStyle.lineHeight) || 21;
          const maxHeight = lineHeight * maxLines;
         
          const tempDiv = document.createElement('div');
          tempDiv.style.position = 'absolute';
          tempDiv.style.visibility = 'hidden';
          tempDiv.style.width = containerRef.current.offsetWidth + 'px';
          tempDiv.style.fontSize = computedStyle.fontSize;
          tempDiv.style.lineHeight = computedStyle.lineHeight;
          tempDiv.style.fontFamily = computedStyle.fontFamily;
          tempDiv.style.fontWeight = computedStyle.fontWeight;
          tempDiv.style.wordWrap = 'break-word';
          tempDiv.style.overflowWrap = 'break-word';
          tempDiv.style.whiteSpace = 'normal';
          tempDiv.style.padding = '0';
          tempDiv.style.margin = '0';
          tempDiv.style.boxSizing = 'border-box';
          tempDiv.textContent = text;
          
          document.body.appendChild(tempDiv);
          const actualHeight = tempDiv.scrollHeight;
          document.body.removeChild(tempDiv);
          
          if (actualHeight > maxHeight + 2) {
            setShowReadMore(true);
          } else {
            setShowReadMore(false);
          }
        });
      } else {

        setShowReadMore(true);
      }
    };

    checkTextOverflow();
    const timeoutId = setTimeout(checkTextOverflow, 200);
    
    window.addEventListener('resize', checkTextOverflow);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkTextOverflow);
    };
  }, [text, maxLines, isExpanded]);

  if (!text) return null;

  return (
    <div ref={containerRef} className={`read-more-text ${className}`}>
      <div
        ref={textRef}
        className={`read-more-content ${isExpanded ? "expanded" : "collapsed"}`}
      >
        {text}
      </div>
      {showReadMore && (
        <button
          className="read-more-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Thu gọn" : "Xem thêm"}
        </button>
      )}
    </div>
  );
}

