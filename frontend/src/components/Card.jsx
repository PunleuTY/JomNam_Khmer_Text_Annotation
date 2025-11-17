import React from "react";

const Card = ({ name, title }) => {
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-40 sm:w-44 lg:w-48 
                h-20 sm:h-22 lg:h-24
                flex flex-col justify-center items-center 
                text-center rounded-lg
                bg-white/40 backdrop-blur-md 
                border border-white/60 shadow-md hover:shadow-lg 
                transition duration-300"
      >
        <h2 className="text-sm sm:text-base font-semibold text-gray-900">
          {name}
        </h2>
        <p className="text-xs sm:text-sm font-medium text-gray-600 mt-0.5">
          {title}
        </p>
      </div>
    </div>
  );
};

export default Card;
