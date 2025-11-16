// src/components/Footer.jsx
import { FaGithub, FaTelegramPlane, FaFacebook } from "react-icons/fa";
import JomNam_Logo from "../assets/JomNam_New_Logo1.png";

import { MdMailOutline } from "react-icons/md";
import { HiOutlineLocationMarker } from "react-icons/hi";

const Footer = () => {
  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Annotation", href: "/annotate" },
    { name: "Projects", href: "/project" },
    { name: "About", href: "/about" },
  ];

  return (
    <footer className="bg-white text-[#12284C] pt-4">
      {/* Mobile: 2x2 grid (logo | quick links) (contact | follow)
          md+: revert to multi-column layout
          Wrap grid so the whole 2x2 block is horizontally centered on small screens. */}
      <div className="flex justify-center px-4">
        <div className="mx-auto max-w-[720px] md:max-w-6xl inline-grid md:grid grid-cols-2 grid-rows-2 md:grid-cols-[1fr_0.8fr_1fr_1fr] md:grid-rows-1 gap-5 text-left text-sm">
          {/* First Grid: Logo */}
          <div className="col-start-1 row-start-1 flex flex-col items-start mt-4 md:col-auto md:row-auto">
            <div>
              <img
                src={JomNam_Logo}
                alt="JomNam Logo"
                className="w-[180px] h-auto object-contain"
              />
            </div>
            <div className="mt-3">
              <p className="text-left font-semibold text-xs">
                Supporting Khmer language AI <br /> research and dataset
                creation <br /> through advanced text and <br /> image
                annotation tools.
              </p>
            </div>
          </div>

          {/* Quick Link */}
          <div className="col-start-2 row-start-1 mt-4 md:col-auto md:row-auto text-left">
            <h4 className="text-lg font-bold mb-2">Quick Links</h4>
            <ul className="space-y-1">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="hover:cursor-pointer ">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-start-1 row-start-2 mt-4 md:col-auto md:row-auto text-left">
            <h4 className="font-bold mb-2 text-left text-lg">Contact Us</h4>
            <div className="flex justify-start space-x-2 mt-2">
              <MdMailOutline className="text-xl" />
              <a
                href="mailto:contact@khmer-annotation.org"
                className="hover:underline"
              >
                contact@khmer-annotation.org
              </a>
            </div>
            <div className="flex justify-start space-x-2 mt-2">
              <HiOutlineLocationMarker className="text-xl" />
              <p>CADT, Phnom Penh, Cambodia</p> {/* location */}
            </div>
          </div>

          {/* Follow US */}
          <div className="col-start-2 row-start-2 mt-4 md:col-auto md:row-auto text-left">
            <h4 className="font-bold mb-2 text-lg">Follow Us</h4>
            <div className="space-y-1 flex gap-4 justify-start">
              <div>
                <a
                  href="https://github.com/PunleuTY/Khmer-Data-Annotation-Project.git"
                  target="_blank"
                  className="flex items-center space-x-2 hover:underline hover:text-[#F88F2D]"
                >
                  <FaGithub className="text-2xl" />
                </a>
              </div>
              <div>
                <a
                  href="#"
                  target="_blank"
                  className="flex items-center space-x-2 hover:underline hover:text-[#F88F2D]"
                >
                  <FaFacebook className="text-2xl" />
                </a>
              </div>
              <div>
                <a
                  href="#"
                  target="_blank"
                  className="flex items-center space-x-2 hover:underline hover:text-[#F88F2D]"
                >
                  <FaTelegramPlane className="text-2xl" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Line - responsive: stack on small screens, inline on md+ */}
      <div className="mt-8 bg-[#F88F2D] text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center md:justify-between gap-3">
          <div className="text-sm font-semibold">
            ©2025 Khmer Data Annotation Tool
          </div>

          <div className="flex items-center gap-4 text-sm">
            <a href="#" className="hover:underline">
              Privacy & Policy
            </a>
            <span className="hidden md:inline">•</span>
            <a href="#" className="hover:underline">
              Terms & Conditions
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
