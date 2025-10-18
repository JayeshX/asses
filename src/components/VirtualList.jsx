import { useState, useRef, useCallback } from 'react';
// import './VirtualList.css';

export function VirtualList({ data, rowHeight = 60, containerHeight = 600 }) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  
  const visibleRows = Math.ceil(containerHeight / rowHeight);
  const totalHeight = data.length * rowHeight;
  const startIndex = Math.floor(scrollTop / rowHeight);
  const endIndex = Math.min(startIndex + visibleRows + 10, data.length);
  const visibleData = data.slice(startIndex, endIndex);
  const offsetY = startIndex * rowHeight;
  
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className="virtual-list-container"
      onScroll={handleScroll}
      style={{ height: `${containerHeight}px`, overflow: 'auto' }}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)`, willChange: 'transform' }}>
          {visibleData.map((customer, idx) => (
            <CustomerRow 
              key={startIndex + idx} 
              customer={customer}
              style={{ height: `${rowHeight}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CustomerRow({ customer, style }) {
  return (
    <div className="customer-row" style={style}>
      <div className="customer-info">
        <img src={customer.avatar} alt="" />
        <div>
          <div className="customer-name">{customer.name}</div>
          <div className="customer-phone">{customer.phone}</div>
        </div>
      </div>
      <div>{customer.score}</div>
      <div>{customer.email}</div>
      <div>{new Date(customer.lastMessageAt).toLocaleString()}</div>
      <div>{customer.addedBy}</div>
    </div>
  );
}
