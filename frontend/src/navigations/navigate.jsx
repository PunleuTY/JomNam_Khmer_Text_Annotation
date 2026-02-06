import { NavLink, useNavigate } from "react-router-dom";
import { RiErrorWarningLine } from "react-icons/ri";
import { FaSortAmountUp, FaHome } from "react-icons/fa";
import { MdOutlineUploadFile } from "react-icons/md";
import { TbLogout2 } from "react-icons/tb";
import { HiMenuAlt3, HiX } from "react-icons/hi";
import { useState } from "react";
import NewLogo from "../assets/JomNam_New_Logo1.png";
import { useAuth } from "@/hooks/useAuth";

const Sidebar = () => {
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogin = () => {
    navigate("/login");
  };

  const navigationItems = [
    { name: "Home", path: "/", icon: FaHome },
    { name: "Annotation", path: "/annotate", icon: MdOutlineUploadFile },
    { name: "Projects", path: "/project", icon: FaSortAmountUp },
    { name: "About", path: "/about", icon: RiErrorWarningLine },
  ];

  return (
    <div className="w-full bg-white">
      {/* Desktop Navigation */}
      <nav className="hidden md:block shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <NavLink to="/" className="flex items-center space-x-3">
              <img
                src={NewLogo}
                alt="Logo"
                className=" object-cover w-32 h-12 p-0"
              />
            </NavLink>

            {/* Navigation Menu */}
            <div className="flex items-center space-x-2 gap-3">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onMouseEnter={() => setHoveredItem(item.name)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={({ isActive }) =>
                      `relative px-6 py-2.5 rounded-md font-medium text-sm transition-all duration-300 ease-in-out transform ${
                        isActive
                          ? "bg-linear-to-r from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-200 scale-105"
                          : "text-gray-700 hover:bg-gray-100 hover:scale-105"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="relative z-10 flex items-center space-x-2">
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </span>

                        {!isActive && hoveredItem === item.name && (
                          <span className="absolute inset-0 bg-linear-to-r from-gray-50 to-gray-100 rounded-full opacity-0 animate-pulse"></span>
                        )}

                        {/* Removed small active-dot indicator to avoid the circle under active link */}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>

            {/* Profile or Login Section */}
            {isAuthenticated ? (
              <div className="relative cursor-pointer group">
                <NavLink
                  key={"profile"}
                  to={"profile"}
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110 overflow-hidden"
                >
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to blue circle if image fails to load
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center ${
                      user?.photoURL ? "hidden" : "flex"
                    }`}
                  >
                    <span className="text-white font-bold text-lg">
                      {user?.displayName?.charAt(0)?.toUpperCase() ||
                        user?.email?.charAt(0)?.toUpperCase() ||
                        "U"}
                    </span>
                  </div>
                </NavLink>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="px-5 py-2.5 rounded-md text-sm font-medium text-white bg-linear-to-r from-orange-400 to-orange-500 shadow-md hover:shadow-lg transition-all duration-300"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-6 py-4 shadow-md">
          <NavLink to="/" className="flex items-center space-x-3">
            <img
              src={NewLogo}
              alt="Logo"
              className=" object-cover w-28 h-10 p-0"
            />
          </NavLink>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? (
              <HiX className="w-6 h-6 text-gray-700" />
            ) : (
              <HiMenuAlt3 className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-6 py-4 space-y-3 bg-gray-50 shadow-inner">
            {/* Profile or Login in Mobile */}
            {isAuthenticated ? (
              <div className="flex items-center justify-center pb-4 border-b border-gray-200">
                <div className="relative">
                  <NavLink
                    key={"profile"}
                    to={"profile"}
                    className="w-20 h-20 rounded-full flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110 overflow-hidden"
                  >
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to blue circle if image fails to load
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center ${
                        user?.photoURL ? "hidden" : "flex"
                      }`}
                    >
                      <span className="text-white font-bold text-xl">
                        {user?.displayName?.charAt(0)?.toUpperCase() ||
                          user?.email?.charAt(0)?.toUpperCase() ||
                          "U"}
                      </span>
                    </div>
                  </NavLink>
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center pb-4 border-b border-gray-200">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogin();
                  }}
                  className="px-6 py-2.5 rounded-lg text-base font-medium text-white bg-linear-to-r from-orange-400 to-orange-500 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Login
                </button>
              </div>
            )}

            {/* Mobile Navigation Items */}
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={({ isActive }) =>
                    `w-full px-6 py-3 rounded-xl font-medium text-base transition-all duration-300 flex items-center space-x-3 animate-slideIn ${
                      isActive
                        ? "bg-linear-to-r from-orange-400 to-orange-500 text-white shadow-lg"
                        : "text-gray-700 hover:bg-white hover:shadow-md"
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}

            {/* Logout Button (only show if logged in) */}
            {isAuthenticated && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full px-6 py-3 rounded-xl font-medium text-base text-gray-600 hover:bg-white hover:text-red-500 hover:shadow-md transition-all duration-300 flex items-center justify-center space-x-2 mt-4"
              >
                <TbLogout2 className="w-5 h-5" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
