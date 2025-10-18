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
      <input
        type="text"
        placeholder="Search Customers"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
}
