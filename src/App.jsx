import { useState, useEffect } from "react";
import axios from "axios";
import FutureCard from "./components/FutureCards";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import Loader from "./components/Loader";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_KEY = import.meta.env.VITE_APP_WEATHER_API_KEY;

const WeatherApp = () => {
  const [weather, setWeather] = useState(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hourlyForecast, setHourlyForecast] = useState()
  const [futureForecast, setFutureForecast] = useState([])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      fetchWeatherByCoords(latitude, longitude);
    });
  }, []);

  useEffect(() => {
    fetchHourlyForecast(query)
  }, [query])


  const fetchWeatherByCoords = async (lat, lon) => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );
      setWeather(data);
      console.log(data)
      setQuery(data.name);
      setError("");
    } catch (err) {
      setWeather(null)
      setError("Failed to fetch weather.");
    }
    setLoading(false);
  };


  const fetchWeatherByCity = async (city) => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      );
      setWeather(data);
      setError("");
    } catch (err) {
      setWeather(null)
      setError("City not found.");
    }
    setLoading(false);
  };

  const fetchCitySuggestions = async (search) => {
    if (!search) return setSuggestions([]);
    const { data } = await axios.get(
      `https://api.openweathermap.org/geo/1.0/direct?q=${search}&limit=5&appid=${API_KEY}`
    );
    setSuggestions(data.map((city) => city.name));
  };

  const fetchHourlyForecast = async (city) => {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      const hourlyData = data.list.slice(0, 8).map((entry) => ({
        time: new Date(entry.dt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        temp: entry.main.temp,
      }));

      const dailyData = {};
      data.list.forEach((entry) => {
        const date = new Date(entry.dt * 1000).toLocaleDateString("en-US", { weekday: "long" });

        if (!dailyData[date]) {
          dailyData[date] = {
            minTemp: entry.main.temp,
            maxTemp: entry.main.temp,
            condition: entry.weather[0].main,
            icon: entry.weather[0].icon,
          };
        } else {
          dailyData[date].minTemp = Math.min(dailyData[date].minTemp, entry.main.temp);
          dailyData[date].maxTemp = Math.max(dailyData[date].maxTemp, entry.main.temp);
        }
      });

      const futureDays = Object.entries(dailyData)
        .slice(1, 4)
        .map(([day, data]) => ({
          day,
          minTemp: Math.floor(data.minTemp),
          maxTemp: Math.floor(data.maxTemp),
          condition: data.condition,
          iconUrl: `https://openweathermap.org/img/wn/${data.icon}.png`,
        }));

      setHourlyForecast(hourlyData);
      setFutureForecast(futureDays);

    } catch (error) {
      console.error("Error fetching forecast:", error);
    }
  };

  const HourlyWeatherChart = ({ hourlyData }) => {
    const filteredData = hourlyData.slice(0, 4);

    const chartData = {
      labels: filteredData.map((item) => item.time),
      datasets: [
        {
          label: "Temperature",
          data: filteredData.map((item) => item.temp),
          borderColor: "#8C8C8C",
          backgroundColor: "#00AAE9",
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
          fill: false,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { display: false },
        y: { display: false },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            label: (context) => `Temp: ${context.raw}°C`,
          },
        },
      },
    };

    return (
      <div className="w-full h-20 bg-[#E9FBFF] p-4 rounded-xl mt-5">
        <Line data={chartData} options={options} />
      </div>
    );
  };


  return (
    <div className="flex flex-col items-start justify-center w-full md:w-[90%] xl:w-[66%] min-h-screen p-6">

      <div className="relative w-full">
        <input
          type="text"
          placeholder="Search or Enter City Name"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            fetchCitySuggestions(e.target.value);
          }}
          className="w-full px-10 py-6 pl-12 bg-[#FBFBFB] text-black placeholder-gray-400 rounded-lg shadow-2xs focus:outline-none"
        />
        <svg
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35m2.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {suggestions.length > 0 && (
          <ul className="absolute w-full bg-[#FBFBFB] border border-gray-300 mt-1 rounded-lg shadow-md">
            {suggestions.map((city, i) => (
              <li
                key={i}
                onClick={() => {
                  setQuery(city);
                  fetchWeatherByCity(city);
                  setSuggestions([]);
                }}
                className="p-3 text-gray-700 cursor-pointer hover:bg-gray-100 transition duration-200 border-b border-gray-300 last:border-b-0 text-left hover:rounded-lg"
              >
                {city}
              </li>
            ))}
          </ul>

        )}
      </div>
      {loading ? (
        <Loader />
      ) : weather && (<div className=" flex flex-wrap justify-between mt-4 w-full">
        <div className="flex flex-col justify-between items-start w-full md:w-[48%] xl:w-[48%] px-8 py-4 bg-[#FBFBFB] text-gray-800 rounded-2xl shadow-md mb-4">
          <p className="text-2xl font-bold text-blue-600">{weather.name}</p>

          <div className="w-full flex  items-center justify-between mt-4">
            <div className="flex justify-start gap-8 w-full">
              <img
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}.png`}
                alt="Weather Icon"
                className="w-12 h-12 bg-[#77cce6] rounded-lg"
              />

              <div className="flex flex-col justrify-between w-full">
                <div className="flex justify-between">
                  <div className="flex items-center"><img src="/src/assets/temp.svg" alt="Real Feel Icon" className="w-4 h-4 mr-2 mt-1.5" /><p className="text-sm text-left">Real Feel</p></div>
                  <p className="text-sm text-black font-medium">{Math.floor(weather.main.feels_like)}°C</p>
                </div>

                <div className="flex justify-between">

                  <div className="flex"><img src="/src/assets/temp.svg" alt="Real Feel Icon" className="w-4 h-4 mr-2 mt-1.5" /><p className="text-sm text-left">Humidity</p></div>
                  <p className="text-sm text-black font-medium">{weather.main.humidity}%</p>
                </div>

                <div className="flex justify-between">
                  <div className="flex"><img src="/src/assets/temp.svg" alt="Real Feel Icon" className="w-4 h-4 mr-2 mt-1.5" /><p className="text-sm text-left">Wind</p></div>
                  <p className="text-sm text-black font-medium">{weather.wind.speed}kmph</p>
                </div>
              </div>



            </div>
          </div>


          <div className="flex justify-between mt-4">
            <div className="flex flex-col items-start text-left">
              <p className="flex flex-col items-start text-3xl font-bold">{Math.floor(weather.main.temp)}°C</p>
              <p className="text-lg capitalize text-black font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                {weather.weather[0].description}
              </p>
            </div>

            <div className="w-px h-18 bg-gray-300 mx-4"></div>

            <div className="flex flex-col justify-evenly items-start w-full text-[#858585] text-sm">
              <div className="flex justify-between flex-nowrap items-start w-full">
                <p className="text-black text-left font-medium break-words whitespace-normal">Rise: {new Date(weather.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="flex justify-between w-full">
                <p className="text-black text-left font-medium">Set: {new Date(weather.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

          </div>
        </div>

        <div className="flex flex-col justify-center items-start w-full sm:w-full md:w-[48%] px-4 py-6 bg-[#FBFBFB] text-gray-800 rounded-2xl shadow-md mb-4">
          <div className="w-full flex justify-evenly items-center">
            <div className="flex flex-col gap-0.5 items-start">
              <p className="text-2xl font-bold text-black">{new Date(weather.dt * 1000).toLocaleDateString("en-US", { weekday: "long" })}</p>
              <p className="text-gray-500 text-sm">{new Date(weather.dt * 1000).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })}
              </p>
              <p className="text-gray-500 text-sm">{new Date(weather.dt * 1000).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true
              })}
              </p>
            </div>

            <div className="w-px h-18 bg-gray-300 mx-4"></div>

            <div className="flex flex-col gap-0.5 items-start justify-between">
              <p className="text-gray-500 text-md">High: <span className="text-black font-bold">{Math.floor(weather.main.temp_max)}°C</span></p>
              <p className="text-gray-500 text-md">Low: <span className="text-black font-bold">{Math.floor(weather.main.temp_min)}°C</span></p>
            </div>
          </div>

          {/* Placeholder for graph */}
          {hourlyForecast?.length > 0 && <HourlyWeatherChart hourlyData={hourlyForecast} />}
          <p className="flex justify-center text-center text-[#858585] text-sm font-medium mt-2">24-Hour Forecast</p>
        </div>



        <p className="text-3xl font-bold text-left mb-4">Future Forecast</p>
        <div className="flex flex-col items-satrt w-full">

          <div className="flex flex-col sm:flex-row justify-between w-full gap-4">
            {futureForecast.map((day, index) => (
              <FutureCard
                key={index}
                condition={day.condition}
                temperature={`${(day.maxTemp + day.minTemp) / 2}°C`} // Show High/Low temp
                day={day.day}
                iconUrl={day.iconUrl}
                className="w-full sm:w-[30%] md:w-[24%]"
              />
            ))}
          </div>


        </div>
      </div>)}
      {error &&
        <div className="w-full flex flex-col items-center justify-center p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md mt-4">
          <h2 className="text-md font-semibold">Oops! Something went wrong</h2>
          <p className="text-sm text-gray-700 mt-1">{error}</p>
        </div>}
    </div>
  );
};

export default WeatherApp;
