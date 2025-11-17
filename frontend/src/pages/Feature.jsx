import { LuShapes } from "react-icons/lu";
import { FiUpload } from "react-icons/fi";
import { BsBoundingBoxCircles } from "react-icons/bs";
import { TbTextScan2 } from "react-icons/tb";
import { HiOutlineClipboardCheck } from "react-icons/hi";
import { PiExportBold } from "react-icons/pi";
// Footer is provided by the global layout
// import { NavLink,Navigate } from "react-router-dom";
import Footer from "../components/Footer";

const featuresData = [
  {
    icon: FiUpload,
    title: "Create Project Workspace / Upload Dataset",
    description:
      "Easily create workspace and upload your image with format (JPG/PNG).",
    tag: "Dataset",
  },
  {
    icon: BsBoundingBoxCircles,
    title: "Bounding Box Annotation",
    description: "Annotate objects with accurate bounding boxes.",
    tag: "Annotation",
  },
  {
    icon: LuShapes,
    title: "Polygon Annotation",
    description: "Create polygon shapes for more precise annotations.",
    tag: "Annotation",
  },
  {
    icon: TbTextScan2,
    title: "OCR",
    description: "Extract text from images using OCR technology.",
    tag: "OCR",
  },
  {
    icon: HiOutlineClipboardCheck,
    title: "Validation",
    description: "Check and validate dataset quality easily.",
    tag: "Quality",
  },
  {
    icon: PiExportBold,
    title: "Export",
    description: "Export processed data in JSON.",
    tag: "Output",
  },
];

const SidebarItem = () => {
  return (
    <div className="text-[#12284c] rounded-lg p-6 text-center mt-6 shadow-md bg-gray-50 transition-transform">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
        Ready to Annotate Your Data?
      </h2>
      <p className="mb-6 text-sm sm:text-base md:text-lg">
        Upload your datasets Khmer and get detailed validation results in
        seconds!
      </p>
      <a href="/annotate">
        <button className="bg-[#F88F2D] text-white font-semibold px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-xl shadow hover:bg-white hover:text-[#F88F2D] transition text-xs sm:text-sm md:text-base whitespace-nowrap">
          Start Validate Now
        </button>
      </a>
    </div>
  );
};

const Features = () => {
  return (
    <div className="min-h-full bg-gray-50">
      <main className="flex-1 p-8 bg-gray-50 overflow-y-auto">
        <h1 className="text-2xl md:text-5xl text-center sm:text-4xl font-cadt text-[#F88F2D]">
          Powerful Features
        </h1>
        <p className="text-gray-600 sm:text-lg text-base mt-4 sm:mt-6 mb-4 sm:mb-6 text-center">
          Easily upload, annotate, and validate your Khmer datasets with OCR
          extraction, precise labeling, accuracy metrics, and export options-All
          in one efficient tool.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
          {featuresData.map((f, i) => (
            <div
              key={i}
              div
              className="bg-white rounded-lg shadow p-4 flex space-x-4 
                hover:bg-red-50 hover:shadow-lg transition 
                duration-300 ease-in-out"
            >
              <div className="text-3xl text-gray-500 border-r p-6 flex justify-center items-center border-blue-200">
                <f.icon />
              </div>

              <div>
                <h2 className="font-semibold text-gray-600 text-base">
                  {f.title}
                </h2>
                <span className="inline-block px-2 py-0.5 mt-1 text-xs bg-red-50 text-gray-600 rounded">
                  {f.tag}
                </span>
                <p className="text-sm text-gray-600 mt-2">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
        <SidebarItem />
      </main>
      <Footer />
    </div>
  );
};

export default Features;
