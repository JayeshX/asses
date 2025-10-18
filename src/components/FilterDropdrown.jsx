import { useState } from 'react';
import { ReactComponent as DownIcon } from "../assets/test_Filter.svg";

export function FilterDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="filter-container">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1">
        <DownIcon
            className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
            }`}
        />
        Add Filters
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
