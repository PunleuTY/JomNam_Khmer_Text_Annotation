import React from "react";

const mission = {
  title: "Our Mission",
  image:
    "https://i.pinimg.com/1200x/74/d9/3f/74d93fe94253c432bb0a4b7b2ead1a4c.jpg",
  text: "Enable students and researchers to build high-quality Khmer OCR datasets efficiently through intuitive annotation, and easy validation.",
};

const vision = {
  title: "Our Vision",
  image:
    "https://i.pinimg.com/736x/20/8e/c6/208ec63c8e2a16e00af077c2facb5707.jpg",
  text: "Become a trusted foundation for Khmer language digitization efforts by providing accessible tools and best practices for data annotation.",
};

const MissionVision = () => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
      {[mission, vision].map((item, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition duration-300 border-b-4 border-t-4 border-[#12284C]"
        >
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-64 object-contain mb-4"
          />
          <h2 className="text-3xl font-bold text-[#12284c] mb-2">
            {item.title}
          </h2>
          <p className="text-[#12284c] text-xl">{item.text}</p>
        </div>
      ))}
    </div>
  );
};

export default MissionVision;
