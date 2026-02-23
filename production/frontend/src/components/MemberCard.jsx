import React from 'react';

const MemberCard = ({ image, name, title, description, contact}) => {

  return (
    <div className="flex flex-col sm:flex-row items-start bg-white px-6 py-6 gap-8 max-w-3xl">
      {/* Image section */}
      <div className="bg-[#12284c] p-1 w-36 h-36 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Text section */}
      <div className="flex-1 text-left">
        <h2 className="text-xl font-semibold text-gray-900">{name}</h2>
        <p className="text-sm font-semibold text-gray-500 mt-1 tracking-wide">
          {title}
        </p>
        <p className="mt-3 text-sm text-gray-400 leading-relaxed">
          {description}
        </p>
        {/* Contact Button */}
        <a
          href={`mailto:${contact}?subject=Hello ${name}&body=Hi ${name},`}
          className="inline-block mt-3 bg-[#12284c] font-bold text-white px-4 py-2 rounded-xl hover:bg-[#ff3f34] hover:shadow-lg transition duration-300"
        >
          Connect
        </a>
      </div>
    </div>
  );
};

export default MemberCard;
