import React from "react";

interface FutureCardProps {
  condition: string;
  temperature: number;
  day: string;
  iconUrl: string;
}

const FutureCard: React.FC<FutureCardProps> = ({ condition, temperature, day, iconUrl }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col justify-between w-full sm:w-[48%] md:w-[30%] lg:w-[32%] h-[175px]">
      <div className="flex justify-between items-center">
        <p className="text-lg font-bold text-blue-600 mr-2">{condition}</p>
        
        <div className="flex-shrink-1">
          <img 
            src={iconUrl} 
            alt="Weather Icon" 
            className="w-14 bg-[#77cce6] rounded-lg max-w-full "
          />
        </div>
      </div>

      <div className="flex flex-col items-start text-center">
        <p className="text-lg font-bold text-gray-800">{temperature}°C</p>
        <p className="text-gray-500 text-md">{day}</p>
      </div>
    </div>
  );
};

export default FutureCard;
