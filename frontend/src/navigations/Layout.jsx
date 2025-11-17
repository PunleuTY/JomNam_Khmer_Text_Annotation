import { Outlet } from "react-router-dom";
import Sidebar from "./navigate";
import Footer from "../components/Footer";

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Fixed Sidebar Navigation */}
      <div className="z-10 fixed w-screen">
        <Sidebar />
      </div>
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-100">
        <div className="mt-20 flex-1">
          <Outlet />
        </div>
      </main>
      {/* Global Footer (single instance) */}
      {/* <Footer /> */}
    </div>
  );
};

export default Layout;
