import React, { useState, useCallback } from 'react';
import axios from 'axios';
// You can use lodash.debounce or write a simple custom debounce function
import debounce from 'lodash.debounce'; 

const MapSearch = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Function to call your Backend Autosuggest API
  const fetchSuggestions = async (input) => {
    if (!input || input.length < 3) return; // API restriction recommendation

    try {
      const response = await axios.get(`http://localhost:3000/api/places/search`, {
        params: { query: input } // Add location: 'lat,lng' here if needed
      });
      
      // The response contains 'suggestedLocations' array
      setSuggestions(response.data.suggestedLocations || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  // Debounce the API call to avoid hitting limits
  const debouncedFetch = useCallback(debounce((input) => fetchSuggestions(input), 300), []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    debouncedFetch(val);
  };

  // 2. Function to call your Backend Place Details API
  const handleSelectPlace = async (eloc) => {
    setLoading(true);
    setSuggestions([]); // Clear suggestions
    try {
      // Use the eLoc from the selected suggestion
      const response = await axios.get(`http://localhost:3000/api/places/details/${eloc}`);
      setSelectedPlace(response.data);
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Mappls Place Search</h2>
      
      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search for places (e.g., Shoes, Delhi)..."
          style={{ width: '100%', padding: '10px', fontSize: '16px' }}
        />
        
        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <ul style={{ 
            border: '1px solid #ccc', 
            listStyle: 'none', 
            padding: 0, 
            margin: 0, 
            position: 'absolute', 
            width: '100%', 
            backgroundColor: 'white', 
            zIndex: 10 
          }}>
            {suggestions.map((item) => (
              <li 
                key={item.eLoc} // eLoc is the unique identifier
                onClick={() => {
                  setQuery(item.placeName);
                  handleSelectPlace(item.eLoc);
                }}
                style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
              >
                <strong>{item.placeName}</strong>
                <br />
                <span style={{ fontSize: '12px', color: '#666' }}>{item.placeAddress}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected Place Details */}
      {loading && <p>Loading details...</p>}
      
      {selectedPlace && (
        <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
          <h3>{selectedPlace.name}</h3> {/* */}
          <p><strong>Address:</strong> {selectedPlace.address}</p> {/* */}
          <p><strong>Type:</strong> {selectedPlace.type}</p> {/* */}
          
          {/* Note: Coordinates are restricted in some sub-templates */}
          {selectedPlace.latitude && selectedPlace.longitude && (
             <p><strong>Coordinates:</strong> {selectedPlace.latitude}, {selectedPlace.longitude}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MapSearch;