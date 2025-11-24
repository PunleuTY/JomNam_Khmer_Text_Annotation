import React, { useState, useEffect } from "react";
import { editProjectAPI } from "../../server/getProjectResult";
import { toast } from "react-toastify";

export const EditModal = ({ isOpen, onClose, onEdited, item }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Update form data when item changes
  useEffect(() => {
    if (item && isOpen) {
      console.log("EditModal: item received:", item);
      setFormData({
        name: item.name || item.title || "",
        description: item.description || "",
      });
      console.log("EditModal: formData set to:", {
        name: item.name || item.title || "",
        description: item.description || "",
      });
    }
  }, [item, isOpen]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const editProject = async () => {
    console.log("=== EDIT PROJECT STARTED ===");
    console.log("formData.name:", formData.name);
    console.log("formData.description:", formData.description);
    console.log("item:", item);

    if (!formData.name.trim()) {
      toast.warn("Title cannot be empty!");
      return;
    }
    if (!item?.id) {
      toast.error("No project selected to edit!");
      return;
    }

    setLoading(true);
    try {
      console.log("editModal: calling editProjectAPI with", item.id, formData);
      const updatedProject = await editProjectAPI(item.id, formData);
      console.log("editModal: editProjectAPI returned", updatedProject);

      // notify parent if callback exists (this will trigger data refresh)
      if (onEdited) {
        console.log("Calling onEdited callback...");
        await onEdited(updatedProject);
      }

      toast.success("Project updated successfully!");

      // close modal after successful update and parent notification
      onClose();
    } catch (error) {
      console.error("editModal: editProject failed", error);
      // Show a simple error toast with the error message for debugging
      toast.error(
        `Failed to update project. Please try again.\n${
          error?.message || error
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClose = () => {
    // Don't reset form data on close for edit modal
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* dimmed backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* modal content (above backdrop) */}
      <div className="relative z-10 bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Edit Project</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Edit project title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Description Textarea */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Edit project description"
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Edit Project Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={editProject}
            disabled={loading}
            className={`bg-[#ffa754] hover:bg-[#ffa754] text-white px-6 py-2 rounded-md font-medium transition-colors duration-200 ${
              loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Updating..." : "Update Project"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
