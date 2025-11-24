import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { createProjectAPI } from "../../server/saveResultAPI";
import { toast } from "react-toastify";

// Modal Component for Create Project
export const CreateProjectModal = ({ isOpen, onClose, onCreated }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const createProject = async () => {
    if (!formData.title.trim()) return;
    setLoading(true);
    try {
      const projectName = formData.title || "New Project";
      const description = formData.description || "";
      console.log("createModal: calling createProjectAPI with", projectName);
      const project = await createProjectAPI(projectName, description);
      console.log("createModal: createProjectAPI returned", project.project.id);

      // notify parent if callback exists
      onCreated?.(project);

      // reset form and close modal
      setFormData({ title: "", description: "" });
      onClose();

      // redirect to project page
      navigate("/Annotate/" + project.project.id);
    } catch (error) {
      console.error("createModal: createProject failed", error);
      // Show a simple error toast with the error message for debugging
      toast.error(
        `Failed to create project. Please try again.\n${
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
    setFormData({ title: "", description: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-10 bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <div className="flex mb-8">
          <h2 className="text-center text-xl font-semibold text-gray-800">
            Create New Project
          </h2>
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
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter project title"
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
              placeholder="Enter project description"
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Create Project Button */}
        <div className="flex justify-end mt-6 gap-2 ">
          <button
            onClick={handleClose}
            className="bg-gray-300 hover:bg-gray-600 text-black px-6 py-2 rounded-md font-medium transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={createProject}
            disabled={loading}
            className={`bg-[#F88F2D] hover:bg-orange-300 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200 ${
              loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};
