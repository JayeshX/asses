import { useState } from 'react';

export function FilterDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="filter-container">
      <button onClick={() => setIsOpen(!isOpen)}>
        🔽 Add Filters
      </button>
      {isOpen && (
        <div className="filter-menu">
          <div className="filter-item">Filter 1</div>
          <div className="filter-item">Filter 2</div>
          <div className="filter-item">Filter 3</div>
          <div className="filter-item">Filter 4</div>
        </div>
      )}
    </div>
  );
}
