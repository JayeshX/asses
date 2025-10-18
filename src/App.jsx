import { useState, useEffect, useCallback, useRef } from 'react';
import { initDB, getAllCustomers, getCustomerCount } from './utils/db';
import { SearchBar } from './components/SearchBar';
import { FilterDropdown } from './components/FilterDropdrown';
import './App.css';

function App() {
  const [allCustomers, setAllCustomers] = useState([]); // All data in memory
  const [filteredCustomers, setFilteredCustomers] = useState([]); // After search/sort
  const [displayedCustomers, setDisplayedCustomers] = useState([]); // Currently displayed rows
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const ROWS_PER_PAGE = 30;
  const observerTarget = useRef(null);

  // Load all data from IndexedDB on mount
  useEffect(() => {
    async function loadData() {
      try {
        const db = await initDB();
        const count = await getCustomerCount(db);
        
        if (count === 0) {
          setError('No data found. Please run the seed script first at /seed.html');
          setLoading(false);
          return;
        }
        
        console.log(`Loading ${count} customers from IndexedDB...`);
        const data = await getAllCustomers(db);
        console.log('Data loaded successfully');
        
        setAllCustomers(data);
        setFilteredCustomers(data);
        
        // Initially display first 30 rows
        setDisplayedCustomers(data.slice(0, ROWS_PER_PAGE));
        setHasMore(data.length > ROWS_PER_PAGE);
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMoreRows();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, page, filteredCustomers]);

  // Load more rows
  const loadMoreRows = useCallback(() => {
    const nextPage = page + 1;
    const startIndex = 0;
    const endIndex = nextPage * ROWS_PER_PAGE;
    
    const newDisplayed = filteredCustomers.slice(startIndex, endIndex);
    setDisplayedCustomers(newDisplayed);
    setPage(nextPage);
    
    if (endIndex >= filteredCustomers.length) {
      setHasMore(false);
    }
  }, [page, filteredCustomers]);

  // Search handler
  const handleSearch = useCallback((query) => {
    if (!query.trim()) {
      setFilteredCustomers(allCustomers);
      setDisplayedCustomers(allCustomers.slice(0, ROWS_PER_PAGE));
      setPage(1);
      setHasMore(allCustomers.length > ROWS_PER_PAGE);
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    const filtered = allCustomers.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) ||
      c.email.toLowerCase().includes(lowerQuery) ||
      c.phone.includes(query)
    );
    
    setFilteredCustomers(filtered);
    setDisplayedCustomers(filtered.slice(0, ROWS_PER_PAGE));
    setPage(1);
    setHasMore(filtered.length > ROWS_PER_PAGE);
  }, [allCustomers]);

  // Sort handler
  const handleSort = useCallback((key) => {
    const direction = 
      sortConfig.key === key && sortConfig.direction === 'asc' 
        ? 'desc' 
        : 'asc';
    
    setSortConfig({ key, direction });
    
    const sorted = [...filteredCustomers].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredCustomers(sorted);
    setDisplayedCustomers(sorted.slice(0, page * ROWS_PER_PAGE));
  }, [filteredCustomers, sortConfig, page]);

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading customers...</h2>
        <p>Please wait while we load data from IndexedDB</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container">
        <h2>❌ Error</h2>
        <p>{error}</p>
        <p>
          <a href="/seed.html">Click here to seed the database</a>
        </p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>All Customers <span className="count">{filteredCustomers.length}</span></h1>
      </header>

      <div className="controls">
        <SearchBar onSearch={handleSearch} />
        <FilterDropdown />
      </div>

      <div className="table-container">
        <table className="customer-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')}>
                <div className="th-content">
                  Customer 
                  {sortConfig.key === 'name' && (
                    <span className="sort-icon">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th onClick={() => handleSort('score')}>
                <div className="th-content">
                  Score
                  {sortConfig.key === 'score' && (
                    <span className="sort-icon">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th>Email</th>
              <th onClick={() => handleSort('lastMessageAt')}>
                <div className="th-content">
                  Last message sent at
                  {sortConfig.key === 'lastMessageAt' && (
                    <span className="sort-icon">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th>Added by</th>
            </tr>
          </thead>
          <tbody>
            {displayedCustomers.map((customer) => (
              <tr key={customer.id} className="customer-row">
                <td>
                  <div className="customer-info">
                    <img src={customer.avatar} alt="" className="avatar" />
                    <div>
                      <div className="customer-name">{customer.name}</div>
                      <div className="customer-phone">{customer.phone}</div>
                    </div>
                  </div>
                </td>
                <td>{customer.score}</td>
                <td>{customer.email}</td>
                <td>{new Date(customer.lastMessageAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}</td>
                <td>
                  <div className="added-by">
                    <span className="user-icon">👤</span>
                    {customer.addedBy}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Infinite scroll trigger */}
        {hasMore && (
          <div ref={observerTarget} className="loading-more">
            <div className="spinner"></div>
            <p>Loading more customers...</p>
          </div>
        )}

        {!hasMore && displayedCustomers.length > 0 && (
          <div className="end-message">
            <p>✓ All {filteredCustomers.length} customers loaded</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
