import { useState, useEffect } from 'react';

export function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 250);
    
    return () => clearTimeout(timer);
  }, [query, onSearch]);
  
  return (
    <div className="search-bar">
      <img src="\test_Search-3.svg" alt="Search" className="search-icon" />
      <input
        type="text"
        placeholder="Search Customers"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
}
