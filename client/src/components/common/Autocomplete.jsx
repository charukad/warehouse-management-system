// client/src/components/common/Autocomplete.jsx
import React, { useState, useEffect, useRef } from "react";
import { debounce } from "lodash";
import { searchService } from "../../services/searchService";

const Autocomplete = ({ entity, onSelect, placeholder }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.target)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced search function
  const debouncedSearch = useRef(
    debounce(async (searchQuery) => {
      if (searchQuery.length < 2) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      try {
        const response = await searchService.autoCompleteSearch(
          searchQuery,
          entity
        );
        setResults(response.data);
      } catch (error) {
        console.error("Autocomplete error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300)
  ).current;

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedItem(null);
    setIsLoading(true);
    setShowResults(true);
    debouncedSearch(value);
  };

  // Handle item selection
  const handleSelectItem = (item) => {
    let displayValue = "";

    switch (entity) {
      case "product":
        displayValue = item.product_name;
        break;
      case "shop":
        displayValue = item.shop_name;
        break;
      case "user":
        displayValue = item.full_name;
        break;
      default:
        displayValue = "";
    }

    setQuery(displayValue);
    setSelectedItem(item);
    setShowResults(false);

    if (onSelect) {
      onSelect(item);
    }
  };

  // Render result items based on entity type
  const renderResultItem = (item) => {
    switch (entity) {
      case "product":
        return (
          <div className="flex justify-between">
            <div>
              <div className="font-medium">{item.product_name}</div>
              <div className="text-xs text-gray-500">{item.product_code}</div>
            </div>
            <div className="text-sm">LKR{item.retail_price}</div>
          </div>
        );

      case "shop":
        return (
          <div>
            <div className="font-medium">{item.shop_name}</div>
            <div className="text-xs text-gray-500">{item.address}</div>
          </div>
        );

      case "user":
        return (
          <div>
            <div className="font-medium">{item.full_name}</div>
            <div className="text-xs text-gray-500">
              {item.username} ({item.user_type})
            </div>
          </div>
        );

      default:
        return <div>{JSON.stringify(item)}</div>;
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setShowResults(true)}
        placeholder={placeholder || `Search ${entity}...`}
      />

      {showResults && (query.length >= 2 || results.length > 0) && (
        <div
          ref={resultsRef}
          className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-y-auto border"
        >
          {isLoading ? (
            <div className="p-2 text-gray-500 text-center">Loading...</div>
          ) : results.length > 0 ? (
            <div>
              {results.map((item) => (
                <div
                  key={item._id}
                  className="p-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSelectItem(item)}
                >
                  {renderResultItem(item)}
                </div>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-2 text-gray-500 text-center">
              No results found
            </div>
          ) : null}
        </div>
      )}

      {/* Hidden input for form submission */}
      {selectedItem && (
        <input type="hidden" name={`${entity}_id`} value={selectedItem._id} />
      )}
    </div>
  );
};

export default Autocomplete;
