import { IoMailOpenOutline } from "react-icons/io5";
import { FiPhone } from "react-icons/fi";
import { CiCalendarDate } from "react-icons/ci";
import { FaUserGraduate } from "react-icons/fa6";
import { RiOrganizationChart } from "react-icons/ri";
import { LuUserRound } from "react-icons/lu";
import { FaRegEdit } from "react-icons/fa";
import { useState, useEffect } from "react";

export default function AccountInformation({
  userData,
  onEditClick,
  isEditing,
  onUpdate,
}) {
  const [editedData, setEditedData] = useState(userData);

  // Sync editedData with userData when userData changes
  useEffect(() => {
    setEditedData(userData);
  }, [userData]);

  const handleSave = () => {
    onUpdate(editedData);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <LuUserRound className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-bold text-gray-900">Account Information</h2>
      </div>

      <div className="space-y-5">
        {/* Email */}
        <div className="flex items-start gap-3">
          <IoMailOpenOutline className="w-5 h-5 text-gray-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Email</p>
            <p className="text-sm text-gray-900">{userData.email}</p>
          </div>
        </div>

        {/* Phone Number */}
        <div className="flex items-start gap-3">
          <FiPhone className="w-5 h-5 text-gray-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Phone Number</p>
            {isEditing ? (
              <input
                type="tel"
                value={editedData.phone}
                onChange={(e) =>
                  setEditedData({ ...editedData, phone: e.target.value })
                }
                className="w-full text-sm text-gray-900 border-b border-gray-300 focus:outline-none focus:border-orange-500"
              />
            ) : (
              <p className="text-sm text-gray-900">{userData.phone}</p>
            )}
          </div>
        </div>

        {/* Joined Date */}
        <div className="flex items-start gap-3">
          <CiCalendarDate className="w-5 h-5 text-gray-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Joined date</p>
            <p className="text-sm text-gray-900">{userData.joinedDate}</p>
          </div>
        </div>

        {/* Role */}
        <div className="flex items-start gap-3">
          <FaUserGraduate className="w-5 h-5 text-gray-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Role</p>
            {isEditing ? (
              <input
                type="text"
                value={editedData.role}
                onChange={(e) =>
                  setEditedData({ ...editedData, role: e.target.value })
                }
                className="w-full text-sm text-gray-900 border-b border-gray-300 focus:outline-none focus:border-orange-500"
              />
            ) : (
              <p className="text-sm text-gray-900">{userData.role}</p>
            )}
          </div>
        </div>

        {/* Organization */}
        <div className="flex items-start gap-3">
          <RiOrganizationChart className="w-5 h-5 text-gray-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Organization</p>
            {isEditing ? (
              <input
                type="text"
                value={editedData.organization}
                onChange={(e) =>
                  setEditedData({ ...editedData, organization: e.target.value })
                }
                className="w-full text-sm text-gray-900 border-b border-gray-300 focus:outline-none focus:border-orange-500"
              />
            ) : (
              <p className="text-sm text-gray-900">{userData.organization}</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Button */}
      <button
        onClick={isEditing ? handleSave : onEditClick}
        className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        <FaRegEdit className="w-6 h-6" />
        {isEditing ? "Save Information" : "Edit Information"}
      </button>
    </div>
  );
}
