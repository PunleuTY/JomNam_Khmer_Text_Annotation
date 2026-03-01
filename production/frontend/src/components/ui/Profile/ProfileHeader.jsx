import { useState, useEffect, useRef } from "react";
import { CiEdit } from "react-icons/ci";
import { IoClose } from "react-icons/io5";
import { FiCheck } from "react-icons/fi";
import { getAuthToken } from "@/lib/authUtils";
import { auth } from "@/lib/auth";

export default function ProfileHeader({ userData, isEditing, onUpdate }) {
  const [editedData, setEditedData] = useState(userData);
  const profileImageInputRef = useRef(null);
  const coverImageInputRef = useRef(null);
  const [viewImage, setViewImage] = useState(null); // null, 'profile', or 'cover'
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [uploading, setUploading] = useState({ profile: false, cover: false });

  // Sync editedData with userData when userData changes
  useEffect(() => {
    setEditedData(userData);
  }, [userData]);

  const handleSave = () => {
    onUpdate(editedData);
  };

  const handleBioSave = () => {
    onUpdate({ bio: editedData.bio });
    setIsEditingBio(false);
  };

  const handleProfileImageClick = () => {
    profileImageInputRef.current?.click();
  };

  const handleCoverImageClick = () => {
    coverImageInputRef.current?.click();
  };

  // Get fresh token from Firebase
  const getFreshToken = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      // getIdToken(true) forces a refresh if the token is expired
      const token = await currentUser.getIdToken(true);
      return token;
    }
    return getAuthToken();
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading({ ...uploading, profile: true });

    try {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("type", "profile");

      const token = await getFreshToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${import.meta.env.VITE_BACKEND_BASE_ENDPOINT}/users/upload-photo`, {
        method: "POST",
        body: formData,
        headers,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to upload profile photo");
      }

      const data = await res.json();
      const publicURL = data.url;

      // Update local state with the uploaded image URL
      setEditedData({ ...editedData, profileImage: publicURL });
      onUpdate({ profileImage: publicURL });
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      alert("Failed to upload profile photo: " + error.message);
    } finally {
      setUploading({ ...uploading, profile: false });
      e.target.value = ""; // Reset input
    }
  };

  const handleCoverImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading({ ...uploading, cover: true });

    try {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("type", "cover");

      const token = await getFreshToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${import.meta.env.VITE_BACKEND_BASE_ENDPOINT}/users/upload-photo`, {
        method: "POST",
        body: formData,
        headers,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to upload cover photo");
      }

      const data = await res.json();
      const publicURL = data.url;

      // Update local state with the uploaded image URL
      setEditedData({ ...editedData, coverImage: publicURL });
      onUpdate({ coverImage: publicURL });
    } catch (error) {
      console.error("Error uploading cover photo:", error);
      alert("Failed to upload cover photo: " + error.message);
    } finally {
      setUploading({ ...uploading, cover: false });
      e.target.value = ""; // Reset input
    }
  };

  const handleImageClick = (imageType) => {
    setViewImage(imageType);
  };

  const closeImageView = () => {
    setViewImage(null);
  };

  return (
    <>
      {/* Image Viewer Modal */}
      {viewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeImageView}
        >
          <button
            onClick={closeImageView}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <IoClose className="w-6 h-6 text-white" />
          </button>
          <div className="max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img
              src={
                viewImage === "profile"
                  ? editedData.profileImage || userData.profileImage
                  : editedData.coverImage || userData.coverImage
              }
              alt={viewImage === "profile" ? "Profile" : "Cover"}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Cover Image */}
        <div className="relative h-40 bg-gray-200 flex items-center justify-center overflow-hidden group">
          {editedData.coverImage || userData.coverImage ? (
            <img
              src={editedData.coverImage || userData.coverImage}
              alt="Cover"
              className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
              onClick={() => handleImageClick("cover")}
            />
          ) : (
            <span className="text-gray-400 text-xl font-medium">Cover Image</span>
          )}
          <input
            ref={coverImageInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverImageChange}
            disabled={uploading.cover}
            className="hidden"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCoverImageClick();
            }}
            disabled={uploading.cover}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full border border-gray-300 flex items-center justify-center transition-all shadow-lg z-10 disabled:opacity-50"
            title="Change cover image"
          >
            {uploading.cover ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
            ) : (
              <CiEdit className="w-5 h-5 text-gray-700" />
            )}
          </button>
        </div>

        {/* Profile Picture */}
        <div className="relative px-6 pb-6">
          <div className="flex flex-col items-center -mt-16">
            <div className="relative group">
              <div
                className="w-32 h-32 rounded-full bg-blue-300 border-4 border-white flex items-center justify-center overflow-hidden cursor-pointer transition-transform hover:scale-105"
                onClick={() => handleImageClick("profile")}
              >
                <img
                  src={
                    editedData.profileImage ||
                    userData.profileImage ||
                    "/placeholder.svg"
                  }
                  alt={userData.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                ref={profileImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                disabled={uploading.profile}
                className="hidden"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleProfileImageClick();
                }}
                disabled={uploading.profile}
                className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-md z-10 disabled:opacity-50"
                title="Change profile image"
              >
                {uploading.profile ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
                ) : (
                  <CiEdit className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>

            {/* Name and Username */}
            <div className="mt-4 flex flex-col items-center">
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.name}
                  onChange={(e) =>
                    setEditedData({ ...editedData, name: e.target.value })
                  }
                  className="text-2xl font-bold text-gray-900 text-center border-b-2 border-orange-500 focus:outline-none"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">
                  {userData.name}
                </h1>
              )}

              <p className="text-gray-500 mt-1">@{userData.username}</p>
            </div>

            {/* Bio */}
            <div className="mt-4 w-2xl">
              <div className="flex items-start justify-center gap-2">
                {isEditingBio ? (
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <textarea
                      value={editedData.bio}
                      onChange={(e) =>
                        setEditedData({ ...editedData, bio: e.target.value })
                      }
                      className="w-full text-sm text-gray-600 text-center leading-relaxed border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-orange-500"
                      rows="3"
                      autoFocus
                    />
                    <button
                      onClick={handleBioSave}
                      className="flex items-center gap-1 px-3 py-1 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors"
                    >
                      <FiCheck className="w-3 h-3" />
                      Save
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 text-center leading-relaxed flex-1">
                      {userData.bio || "No bio yet"}
                    </p>
                    <button
                      onClick={() => setIsEditingBio(true)}
                      className="text-gray-400 hover:text-orange-500 transition-colors"
                      title="Edit bio"
                    >
                      <CiEdit className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Save Button - Only show when editing */}
            {isEditing && (
              <div className="mt-4 flex gap-3 justify-center">
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
