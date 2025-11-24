// Footer is provided by the global layout
import { FcApproval } from "react-icons/fc";
import { FaArrowRight } from "react-icons/fa";
// import { MdOutlineArrowDropDown } from "react-icons/md";
import { TiArrowSortedDown } from "react-icons/ti";
import Footer from "../components/Footer";
import homepage from "../assets/homepage1.jpg";
import {
  FaUpload,
  FaDrawPolygon,
  FaRegEdit,
  FaFileExport,
  FaChartLine,
} from "react-icons/fa";
import { GrValidate } from "react-icons/gr";

const dataItems = [
  {
    number: "01",
    title: <span className="text-gray-600">Upload Images</span>,
    description: (
      <>
        <span className=" text-blue-900">Click</span> on select image button to
        adding one or many files (JPG/PNG).
        <p>
          <span className="font-bold text-gray-600">Tip : </span>
          <span>
            {" "}
            Use high-quality, clear images to get better OCR results later.
          </span>
        </p>
      </>
    ),
    color: "bg-red-300",
    icon: <FaUpload style={{ color: "#202381" }} />, // soft red
  },

  {
    number: "02",
    title: <span className="text-gray-600 ">Annotation</span>,
    description: (
      <>
        Select the type of annotation you need:
        <ul className="list-disc ml-5 mt-2">
          <li>Bounding Box: A rectangular shape to mark the text area.</li>
          <li>Polygon: Custom shape that follows the outline of the text.</li>
        </ul>
        <p>
          <span className="font-bold text-gray-600">Tip : </span>
          <span>
            {" "}
            Keep bounding boxes tight around the text without cutting letters.
          </span>
        </p>
      </>
    ),
    color: "bg-red-400",
    icon: <FaDrawPolygon style={{ color: "#202381" }} />,
  },

  {
    number: "03",
    title: <span className="text-gray-600">Extract Text (OCR)</span>,
    description: (
      <>
        Run or Scan OCR engine to extract text.
        <p>
          <span className="font-bold text-gray-600">Tip : </span>
          <span>
            {" "}
            Transforms image-based text into machine-readable format.
          </span>
        </p>
      </>
    ),
    color: "bg-red-300",
    icon: <FaChartLine style={{ color: "#202381" }} />,
  },
  {
    number: "04",
    title: <span className="text-gray-600">Validate</span>,
    description: (
      <>
        Compare OCR output with the actual text (ground truth) you enter.
        <p>
          <span className="font-bold text-gray-600">Tip : </span>
          <span>
            {" "}
            Checks the quality and correct OCR mistakes immediately to improve
            dataset reliability.
          </span>
        </p>
      </>
    ),
    color: "bg-red-400",
    icon: <GrValidate style={{ color: "#202381" }} />,
  },
  {
    number: "05",
    title: <span className="text-gray-500">Edit Result</span>,
    description: (
      <>
        <span className=" text-blue-900">Click</span> on JSON edit button to
        modify the OCR results or annotations.
        <span className=" text-blue-900">Then,</span> Apply changes.
        <p>
          <span className="font-bold text-gray-600">Tip : </span>
          <span>
            {" "}
            If something is incorrect you can fix it before exporting.
          </span>
        </p>
      </>
    ),
    color: "bg-red-300",
    icon: <FaRegEdit style={{ color: "#202381" }} />,
  },

  {
    number: "06",
    title: <span className="text-gray-600">Export</span>,
    description: (
      <>
        Export your annotated data in standard formats JSON/YOLO.
        <p>
          <span className="font-bold text-gray-600">Tip:</span>
          <span> Store your JSON files in safe storage.</span>
        </p>
      </>
    ),
    color: "bg-red-400",
    icon: <FaFileExport style={{ color: "#202381" }} />,
  },
];

export const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="flex flex-col gap-8 p-0 md:pl-20">
              <div className="flex flex-col ">
                <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[#12284c] mb-2 text-start">
                  Welcome To
                </h2>
                <h2 className="text-3xl md:text-5xl font-cadt text-[#F88F2D] mb-3 text-start ">
                  Khmer Text Annotation Tool
                </h2>
              </div>

              <p className="text-[#12284c] font-semibold text-sm sm:text-base lg:text-lg max-w-xl">
                Upload images, annotate text regions, extract Khmer text with
                OCR, and validate against ground truth to build high-quality
                datasets.
              </p>

              <ul className="space-y-3 text-[#12284c] font-semibold text-sm sm:text-base">
                <li className="flex items-center gap-3">
                  <FcApproval className="text-xl flex-shrink-0" />
                  <span>Bounding box and polygon annotations</span>
                </li>
                <li className="flex items-center gap-3">
                  <FcApproval className="text-xl flex-shrink-0" />
                  <span>Khmer and English OCR extraction</span>
                </li>
                <li className="flex items-center gap-3">
                  <FcApproval className="text-xl flex-shrink-0" />
                  <span>Validation with accuracy metrics</span>
                </li>
              </ul>

              <div className="flex flex-wrap gap-4 pt-4">
                <a
                  href="/project"
                  className="bg-[#12284c] text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold text-sm sm:text-base hover:bg-opacity-90 transition-all"
                >
                  Get Started <FaArrowRight />
                </a>

                <button
                  onClick={() => {
                    const element = document.getElementById("instructions");
                    if (element) {
                      element.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }
                  }}
                  className="bg-[#76bc21] hover:cursor-pointer text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold text-sm sm:text-base hover:bg-opacity-90 transition-all"
                >
                  Instruction <TiArrowSortedDown />
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div className="flex items-center justify-center lg:justify-end">
              <div className="w-full max-w-md lg:max-w-lg">
                <img
                  src={homepage}
                  alt="Khmer Text Annotation Example"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions Section */}
      <section
        id="instructions"
        className="bg-[#12284C] text-white py-12 px-4 sm:px-6 lg:px-8 mt-8"
      >
        <div className="container mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            Annotation Workflow Instruction
          </h2>
          <p className="text-sm sm:text-base lg:text-lg max-w-4xl mx-auto opacity-90">
            Follow this detailed step-by-step annotation workflow how to
            annotate images, run OCR, validate, and export your results more
            efficiently.
          </p>
        </div>
      </section>

      {/* Workflow Steps */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dataItems.map((item, index) => (
            <div
              key={index}
              className="bg-white shadow-md rounded-lg p-6 hover:shadow-xl transition-shadow duration-300 flex gap-4"
            >
              {/* Number Badge */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[#F88F2D] text-white text-xl font-bold rounded-full flex items-center justify-center">
                  {item.number}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <div className="text-gray-600 text-sm leading-relaxed">
                  {item.description}
                </div>
              </div>

              {/* Icon */}
              <div className="flex items-start flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gray-50 border-2 border-gray-200 flex items-center justify-center">
                  <span className="text-2xl">{item.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
