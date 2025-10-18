import { useState, useEffect, useCallback, useRef } from 'react';
import { initDB, getCustomerCount, getCustomersBatch, searchCustomers } from './utils/db';
import { SearchBar } from './components/SearchBar';
import { FilterDropdown } from './components/FilterDropdrown';
import './App.css';

function App() {
  const [displayedCustomers, setDisplayedCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [hasMore, setHasMore] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState(new Set());
  
  const dbRef = useRef(null);
  const observerTarget = useRef(null);
  const BATCH_SIZE = 30;

  // initial data load
  useEffect(() => {
    async function loadInitialData() {
      try {
        const db = await initDB();
        dbRef.current = db;
        
        const count = await getCustomerCount(db);
        
        if (count === 0) {
          setError('No data found. Please run the seed script first at /seed.html');
          setLoading(false);
          return;
        }
        
        setTotalCount(count);
        
        const firstBatch = await getCustomersBatch(db, 1, BATCH_SIZE);
        setDisplayedCustomers(firstBatch);
        setHasMore(firstBatch.length === BATCH_SIZE);
        setLoading(false);
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    
    loadInitialData();
  }, []);

  // infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && !isSearching) {
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
  }, [hasMore, loading, loadingMore, isSearching, displayedCustomers]);

  // loaidng more rows
  const loadMoreRows = useCallback(async () => {
    if (!dbRef.current || loadingMore) return;
    
    setLoadingMore(true);
    
    try {
      const lastCustomer = displayedCustomers[displayedCustomers.length - 1];
      const startId = lastCustomer ? lastCustomer.id + 1 : 1;
      
      const nextBatch = await getCustomersBatch(dbRef.current, startId, BATCH_SIZE);
      
      if (nextBatch.length > 0) {
        setDisplayedCustomers(prev => [...prev, ...nextBatch]);
        setHasMore(nextBatch.length === BATCH_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more customers:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [displayedCustomers, loadingMore]);

  // search handler
  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      // reset to first batch
      setIsSearching(false);
      setSearching(true);
      
      try {
        const firstBatch = await getCustomersBatch(dbRef.current, 1, BATCH_SIZE);
        setDisplayedCustomers(firstBatch);
        setHasMore(true);
      } catch (err) {
        console.error('Error resetting data:', err);
      } finally {
        setSearching(false);
      }
      return;
    }
    
    setIsSearching(true);
    setSearching(true);
    
    try {
      const results = await searchCustomers(dbRef.current, query, 1000);
      setDisplayedCustomers(results);
      setHasMore(false);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  // sort handler
  const handleSort = useCallback((key) => {
    const direction = 
      sortConfig.key === key && sortConfig.direction === 'asc' 
        ? 'desc' 
        : 'asc';
    
    setSortConfig({ key, direction });
    
    const sorted = [...displayedCustomers].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    setDisplayedCustomers(sorted);
  }, [displayedCustomers, sortConfig]);

  const toggleSelectAll = () => {
    if (selectedCustomers.size === displayedCustomers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(displayedCustomers.map(c => c.id)));
    }
  };

  const toggleSelectCustomer = (id) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCustomers(newSelected);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading customers...</h2>
        <p>Please wait...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container">
        <h2>Error</h2>
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
        <img src="/logo.png" alt="DoubleTick" className="logo" />
      </header>

      <div className="page-title">
        <h1>All Customers</h1>
        <span className="count-badge">{displayedCustomers.length.toLocaleString()}</span>
      </div>

      <div className="controls">
        <SearchBar onSearch={handleSearch} />
        <FilterDropdown />
      </div>

      {/* Show inline searching indicator */}
      {searching && (
        <div className="search-loading">
          <div className="search-spinner"></div>
          <span>Searching...</span>
        </div>
      )}

      <div className="table-container">
        <table className="customer-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input 
                  type="checkbox" 
                  checked={selectedCustomers.size === displayedCustomers.length && displayedCustomers.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
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
            {displayedCustomers.length === 0 && !searching ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  No customers found
                </td>
              </tr>
            ) : (
              displayedCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="checkbox-col">
                    <input 
                      type="checkbox"
                      checked={selectedCustomers.has(customer.id)}
                      onChange={() => toggleSelectCustomer(customer.id)}
                    />
                  </td>
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
                  <td className="email-col">{customer.email}</td>
                  <td className="date-col">
                    {new Date(customer.lastMessageAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </td>
                  <td>
                    <div className="added-by">
                      <svg className="user-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {customer.addedBy}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {hasMore && !isSearching && !searching && (
          <div ref={observerTarget} className="loading-more">
            {loadingMore && <div className="spinner"></div>}
            <p>{loadingMore ? 'Loading more customers...' : 'Scroll for more'}</p>
          </div>
        )}

        {!hasMore && displayedCustomers.length > 0 && !searching && (
          <div className="end-message">
            <p>Showing {displayedCustomers.length.toLocaleString()} customers</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
