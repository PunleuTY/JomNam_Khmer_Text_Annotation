import { FiLogOut } from "react-icons/fi";
import { FaRegUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function ProfileFooter({ email }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    navigate("/login");
    console.log("Logging out...");
  };

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <FaRegUserCircle className="w-full h-full text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{email}</p>
            <p className="text-xs text-gray-500">Log out from your account</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <FiLogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
