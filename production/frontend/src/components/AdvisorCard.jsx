import React from 'react';

const AdvisorCard = ({ image, name, title, description, additionalInfo }) => {

  return (
    <div className="flex flex-col sm:flex-row items-center bg-white px-6 py-6 gap-6 max-w-3xl">
      {/* Image section */}
      <div className="bg-blue-100 p-1 w-48 h-48 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Text section */}
      <div className="flex-1 text-left">
        <h2 className="text-3xl font-semibold text-gray-900">{name}</h2>
        <p className="text-xl font-semibold text-gray-500 mt-1 tracking-wide">
          {title}
        </p>
        <p className="mt-3 text-xl text-gray-400 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

export default AdvisorCard;
