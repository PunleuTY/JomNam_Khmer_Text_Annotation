import { Outlet } from "react-router-dom";
import Sidebar from "./navigate";

const Layout = () => {
  return (
    <div className="h-screen bg-gray-50">
      {/* Fixed Sidebar Navigation */}
      <div className="z-10 fixed w-screen">
        <Sidebar/>
      </div>
        

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-100 ">
        <div className=" mt-20 h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;