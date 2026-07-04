import React, { useState, useEffect } from 'react';
import axios from 'axios';
import lightmode from './icons8-light-mode-78.png';

export default function WeatherDashboard() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forecast5days, setForecast5Days] = useState([]);
  const [todayAt, setTodayAt] = useState(null);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(''); 
  const [latitude, setLatitude] = useState(51.5072); 
  const [longitude, setLongitude] = useState(0.1276); 
  const [citySuggestions, setCitySuggestions] = useState([]); 
  const [selectedCity, setSelectedCity] = useState(null); 
  const [isDark, setisDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const API_KEY = '6b89577fbaabde0fc564f03bbc909248'; 
  
  const toggleDarkMode = () => {
    setisDark(!isDark);
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  }
  
  const fetchWeatherData = async (latitude, longitude) => {
    setLoading(true);
    try {
      const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`;
      
      const currentWeatherResponse = await axios.get(currentWeatherUrl);
      setWeather(currentWeatherResponse.data);
      
      const forecastResponse = await axios.get(forecastUrl);
      const forecastData = forecastResponse.data.list;
      
      console.log(forecastData);
  
      if (!forecastData || forecastData.length === 0) {
        throw new Error("Forecast data is empty or undefined.");
      }
  
      let fiveDaysForecast = [];
      
      for (let i = 7; i < forecastData.length; i += 8) {  // Start at index 7, take every 8th item (for 3-hour intervals)
        const forecastItem = forecastData[i];
        
        if (!forecastItem) {
          continue; 
        }
        
        const date = new Date(forecastItem.dt * 1000);
        const options = { day: "numeric", month: "long" };
        const formattedDate = date.toLocaleDateString("en-US", options);
        
        const dayName = new Intl.DateTimeFormat("en-US", {
          weekday: "long",
        }).format(date);
  
        fiveDaysForecast.push({
          formattedDate: formattedDate,
          dayName: dayName,
          forecastItem: forecastItem, 
        });
      }
      
      console.log(fiveDaysForecast);  
      setForecast5Days(fiveDaysForecast);  
      setTodayAt(forecastData.slice(0, 8));  
  
      setLoading(false);
    } catch (error) {
      console.error("Error fetching weather data:", error);
      setLoading(false);
    }
  };

  // Debounce the search input query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400); // 400ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch city suggestions with sanitization when debounced query updates
  useEffect(() => {
    const fetchSuggestions = async () => {
      // Input sanitization to prevent injection / XSS (remove special symbols)
      const sanitizedQuery = debouncedSearchQuery.replace(/[<>:"/\\|?*#;{}[\]()]/g, '').trim();
      
      if (sanitizedQuery.length >= 1) {
        try {
          const response = await axios.get(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(sanitizedQuery)}&limit=5&appid=${API_KEY}`
          );
          setCitySuggestions(response.data || []);
        } catch (error) {
          console.error("Error fetching city suggestions:", error);
        }
      } else {
        setCitySuggestions([]);
      }
    };

    fetchSuggestions();
  }, [debouncedSearchQuery]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Instantly clear suggestions if search query is empty
    if (query.trim() === '') {
      setCitySuggestions([]);
    }
  };

  // Fetch weather data for the selected city
  const handleCitySelect = async (city) => {
    setSearchQuery(''); // Clear the search query
    setCitySuggestions([]); // Clear the dropdown
    setIsMobileMenuOpen(false); // Close mobile menu when a city is selected

    // Ensure we select the correct city
    setSelectedCity(city.name); // Store the city name in the state

    const { lat, lon } = city;
    setLatitude(lat);
    setLongitude(lon);
    fetchWeatherData(lat, lon); // Fetch weather data for the selected city
  };

  useEffect(() => {
    if (latitude && longitude) {
      fetchWeatherData(latitude, longitude);
    }
  }, [latitude, longitude]);

  const getCurrentLocationWeather = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lon);
          setSearchQuery('');
          setIsMobileMenuOpen(false); // Close mobile menu when getting current location
          fetchWeatherData(lat, lon);
          console.log(lat,lon);
          getCityNameFromCoords(lat, lon);
        },
        (error) => {
          console.error("Error getting geolocation:", error);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const getCityNameFromCoords = async (latitude, longitude) => {
    try {
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`);
      if (response.data.length > 0) {
        const cityName = response.data[0].name;
        setSelectedCity(cityName); // Set the selected city to the reverse geocoded city name
      }
    } catch (error) {
      console.error("Error getting city name from coordinates:", error);
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="text-center">Loading weather data...</div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="text-center text-red-600">Failed to load weather data</div>
      </div>
    );
  }

  const { main, weather: weatherConditions, wind, visibility } = weather;
  const { temp, humidity, pressure, feels_like } = main || {};
  const { speed } = wind || {};
  const weatherIcon = weatherConditions ? weatherConditions[0].icon : '';
  
  return (
    <div className={`${isDark ? 'bg-[#101014]' : 'bg-white'} min-h-screen overflow-x-hidden`}>
      <div className="container mx-auto px-4 py-6">
        {/* Mobile Header */}
        <header className="block md:hidden mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>ForecastHQ</h1>
            <div className="flex items-center space-x-2">
              <button 
                onClick={toggleDarkMode}
                className="p-2"
              >
                {isDark ? (
                  <img width="24" height="24" src={lightmode} alt="Light mode" />
                ) : (
                  <img width="24" height="24" src="https://img.icons8.com/material-rounded/24/do-not-disturb-2.png" alt="Dark mode" />
                )}
              </button>
              <button
                onClick={toggleMobileMenu}
                className="p-2"
              >
                <i className={`fas fa-bars text-xl ${isDark ? 'text-white' : 'text-black'}`}></i>
              </button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className={`mb-4 transition-all duration-300 ${isDark ? 'bg-[#1b1a1d]' : 'bg-gray-100'} p-4 rounded-lg`}>
              <div className="relative mb-3">
                <input
                  className={`w-full pl-10 pr-4 py-2 rounded-full ${isDark ? 'bg-[#1e1e1e]' : 'bg-gray-200'} ${isDark ? 'text-white': 'text-black'}`}
                  placeholder="Search city..."
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                <i className={`fas fa-search absolute left-3 top-2.5 ${isDark ? 'text-white' : 'text-black'}`}></i>
                {citySuggestions.length > 0 && (
                  <ul className="absolute bg-white border border-gray-300 mt-1 w-full rounded-md shadow-lg z-10">
                    {citySuggestions.map((city) => (
                      <li
                        key={city.id}
                        className="p-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleCitySelect(city)}
                      >
                        {city.name}, {city.state ? city.state + ', ' : ''}{city.country}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-full flex items-center justify-center"
                onClick={getCurrentLocationWeather}>
                <i className="fas fa-map-marker-alt mr-2"></i>Current Location
              </button>
            </div>
          )}
        </header>
        
        {/* Desktop Header */}
        <header className="hidden md:flex justify-between items-center mb-8">
          <div className="flex items-center">
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>ForecastHQ</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                className={`pl-10 pr-4 py-2 rounded-full ${isDark ? 'bg-[#1e1e1e]' : 'bg-gray-200'} ${isDark ? 'text-white': 'text-black'}`}
                placeholder="Search city..."
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <i className={`fas fa-search absolute left-3 top-2.5 ${isDark ? 'text-white' : 'text-black'}`}></i>
              {citySuggestions.length > 0 && (
                <ul className="absolute bg-white border border-gray-300 mt-1 w-full rounded-md shadow-lg z-10">
                  {citySuggestions.map((city) => (
                    <li
                      key={city.id}
                      className="p-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleCitySelect(city)}
                    >
                      {city.name}, {city.state ? city.state + ', ' : ''}{city.country}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-full flex items-center"
              onClick={getCurrentLocationWeather}>
              <i className="fas fa-map-marker-alt mr-2"></i>Current Location
            </button>
            <button onClick={toggleDarkMode}>
              {isDark ? (
                <img width="24" height="24" src={lightmode} alt="Light mode" />
              ) : (
                <img width="27" height="27" src="https://img.icons8.com/material-rounded/24/do-not-disturb-2.png" alt="Dark mode" />
              )}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left section - Current weather */}
          <div className={`${isDark ? 'bg-[#1b1a1d]' : 'bg-gray-200'} p-6 rounded-3xl lg:col-span-3`}>
            <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Now</h2>
            <div className="flex items-center justify-between mb-4">
              <div className={`text-6xl font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{Math.round(temp) ? Math.round(temp) : 'N/A'}°C</div>
              <div className={`w-24 h-24 ${isDark ? 'bg-[#1b1a1d]' : 'bg-gray-200'} rounded-full`}>
                {weatherIcon && (
                  <img
                    src={`http://openweathermap.org/img/wn/${weatherIcon}.png`}
                    alt="weather icon"
                    className="w-full h-full object-cover rounded-full"
                  />
                )}
              </div>
            </div>
            <p className={`text-lg mb-4 ${isDark ? 'text-[#746e73]' : 'text-gray-600'}`}>{weatherConditions ? weatherConditions[0].description.charAt(0).toUpperCase() + weatherConditions[0].description.slice(1) : 'No data available'}</p>
            <hr className="mb-4 border-t-2 border-gray-400" />
            <div className={`flex items-center ${isDark ? 'text-[#746e73]' : 'text-gray-600'} mb-2`}>
              <i className="fas fa-calendar-alt mr-2"></i>
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric',weekday:'long',year:'numeric' })}
            </div>
            <div className={`flex items-center ${isDark ? 'text-[#746e73]' : 'text-gray-600'}`}>
              <i className="fas fa-map-marker-alt mr-2"></i>
              <span>{selectedCity || `${weather.name}`},{weather.sys.country}</span>
            </div>
          </div>

          {/* Middle section - Today Highlights */}
          <div className={`${isDark ? 'bg-[#1b1a1d]' : 'bg-gray-200'} p-6 rounded-3xl lg:col-span-9`}>
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Today Highlights</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className={`${isDark ? 'bg-[#16161a]' : 'bg-gray-300'} p-4 rounded-lg`}>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-[#746e73]' : 'text-gray-600'}`}>Sunrise</h3>
                <div className={`flex items-center ${isDark ? 'text-white' : 'text-black'}`}>
                  <i className="fas fa-sun mr-2"></i>
                  {weather.sys ? new Date(weather.sys.sunrise * 1000).toLocaleTimeString() : 'N/A'}
                </div>
              </div>
              <div className={`${isDark ? 'bg-[#16161a]' : 'bg-gray-300'} p-4 rounded-lg`}>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-[#746e73]' : 'text-gray-600'}`}>Sunset</h3>
                <div className={`flex items-center ${isDark ? 'text-white' : 'text-black'}`}>
                  <i className="fas fa-moon mr-2"></i>
                  {weather.sys ? new Date(weather.sys.sunset * 1000).toLocaleTimeString() : 'N/A'}
                </div>
              </div>
              <div className={`${isDark ? 'bg-[#16161a]' : 'bg-gray-300'} p-4 rounded-lg`}>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-[#746e73]' : 'text-gray-600'}`}>Humidity</h3>
                <div className={`flex items-center ${isDark ? 'text-white' : 'text-black'}`}>
                  <i className="fas fa-tint mr-2"></i>
                  {humidity}%
                </div>
              </div>
              <div className={`${isDark ? 'bg-[#16161a]' : 'bg-gray-300'} p-4 rounded-lg`}>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-[#746e73]' : 'text-gray-600'}`}>Pressure</h3>
                <div className={`flex items-center ${isDark ? 'text-white' : 'text-black'}`}>
                  <i className="fas fa-water mr-2"></i>
                  {pressure || 'N/A'} hPa
                </div>
              </div>
              <div className={`${isDark ? 'bg-[#16161a]' : 'bg-gray-300'} p-4 rounded-lg`}>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-[#746e73]' : 'text-gray-600'}`}>Visibility</h3>
                <div className={`flex items-center ${isDark ? 'text-white' : 'text-black'}`}>
                  <i className="fas fa-eye mr-2"></i>
                  {visibility / 1000} km
                </div>
              </div>
              <div className={`${isDark ? 'bg-[#16161a]' : 'bg-gray-300'} p-4 rounded-lg`}>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-[#746e73]' : 'text-gray-600'}`}>Feels Like</h3>
                <div className={`flex items-center ${isDark ? 'text-white' : 'text-black'}`}>
                  <i className="fas fa-thermometer-half mr-2"></i>
                  {feels_like}°C
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5 Days Forecast & Today at sections - Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* 5 Days Forecast - Reduced width */}
          <div className="lg:col-span-3">
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>5 Days Forecast:</h2>
            <div className={`${isDark ? 'bg-[#1b1a1d]' : 'bg-gray-200'} p-4 rounded-2xl`}>
              {Array.isArray(forecast5days) && forecast5days.length > 0 ? (
                forecast5days.map((day, index) => (
                  <div className="flex items-center mb-4" key={index}>
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 ${isDark ? 'bg-[#1b1a1d]' : 'bg-gray-200'} rounded-full mr-4 flex-shrink-0`}>
                      <img
                        src={`http://openweathermap.org/img/wn/${day.forecastItem.weather[0].icon}.png`}
                        alt="weather icon"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{Math.round(day.forecastItem.main.temp_max)}°C</p>
                      <p className="text-sm text-gray-600">{day.formattedDate}</p>
                      <p className="text-sm text-gray-600">{day.dayName}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p>No forecast data available</p>
              )}
            </div>
          </div>

          {/* Today at - Mobile responsive */}
          <div className="lg:col-span-9">
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Today at</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.isArray(todayAt) &&
                todayAt.slice(0, 6).map((hour, index) => (
                  <div className={`flex flex-col items-center ${isDark ? 'bg-[#1b1a1d]' : 'bg-gray-200'} p-3 rounded-2xl text-center`} key={index}>
                    <p className={`text-md font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                      {new Date(hour.dt * 1000).getHours() % 12 || 12}
                      {new Date(hour.dt * 1000).getHours() >= 12 ? 'PM' : 'AM'}
                    </p>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto my-2">
                      <img
                        src={`http://openweathermap.org/img/wn/${hour.weather[0].icon}.png`}
                        alt="weather-icon"
                        className="w-full h-full"
                      />
                    </div>
                    <p className={`text-md font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{Math.round(hour.main.temp)}°C</p>
                  </div>
                ))}
            </div>

            {/* Wind speeds - Mobile responsive */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
              {Array.isArray(todayAt) &&
                todayAt.slice(0, 6).map((hour, index) => (
                  <div className={`flex flex-col items-center ${isDark ? 'bg-[#1b1a1d]' : 'bg-gray-200'} p-3 rounded-2xl text-center`} key={index}>
                    <p className={`text-md font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                      {new Date(hour.dt * 1000).getHours() % 12 || 12}
                      {new Date(hour.dt * 1000).getHours() >= 12 ? 'PM' : 'AM'}
                    </p>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto my-2 flex items-center justify-center">
                      <i className="fas fa-location-arrow text-blue-500 text-2xl"></i>
                    </div>
                    <p className={`text-md font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{Math.round(hour.wind.speed)}m/s</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}