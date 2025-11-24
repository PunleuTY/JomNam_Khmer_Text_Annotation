import React, { useState, useEffect } from "react";
import { href, useNavigate } from "react-router-dom";
import { MdEdit } from "react-icons/md";
import { MdDelete } from "react-icons/md";
import { MdCreateNewFolder } from "react-icons/md";
import { CreateProjectModal } from "./createModal";
import { deleteProjectAPI } from "@/server/deleteAPI";
import { EditModal } from "@/components/ui/EditModal";
import { toast } from "react-toastify";
import nav2 from "@/assets/nav2.png";
// Modal Component for Full Description (shows full content; no internal scroll)
const DescriptionModal = ({ isOpen, onClose, description, title }) => {
  if (!isOpen) return null;

  return (
    // allow overlay to scroll if content is taller than viewport
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* dimmed backdrop - closes on click */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* center container but allow it to grow; use margin to keep it away from screen edges */}
      <div className="relative min-h-screen flex items-start justify-center py-8 px-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-auto">
          <div className="flex items-start justify-between p-4 border-b">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {title || "Description"}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold ml-2"
              >
                ×
              </button>
            </div>
          </div>

          {/* content: NO max-height and NO internal overflow so full text is shown; preserve newlines */}
          <div className="p-6 text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
            {description ? (
              <div className="max-w-none">{description}</div>
            ) : (
              <div className="text-gray-400">No description available.</div>
            )}
          </div>

          <div className="flex justify-end gap-2 p-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Reusable Table Component
const ReusableTable = ({ data = [], onProjectCreated, page }) => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // simple handler invoked after an edit completes in the EditModal; adjust to refresh parent data if needed
  useEffect(() => {
    if (page) {
      setCreateModalOpen(true);
    }
  }, [page]);
  const onProjectEdited = async (updatedItem) => {
    console.log("Project edited:", updatedItem);

    // Refresh the project list if callback exists
    if (onProjectCreated) {
      await onProjectCreated();
    }
  };

  // Handle modal close - separate from edit completion
  const handleEditModalClose = () => {
    setEditModalOpen(false);
    // Clear selected project after a small delay to ensure modal is fully closed
    setTimeout(() => {
      setSelectedProject(null);
    }, 100);
  };

  // Function to truncate description
  const truncateDescription = (description) => {
    if (!description) return "";
    return description.length > 20
      ? description.substring(0, 20) + "..."
      : description;
  };

  // Function to format date/time
  const formatLastEdit = (lastEdit) => {
    console.log("Formatting lastEdit:", lastEdit);
    if (!lastEdit) return "";
    const date = new Date(lastEdit);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle showing full description in modal
  const showFullDescription = (description) => {
    setSelectedDescription(description);
    setModalOpen(true);
  };

  // Example handleEdit function to open edit modal
  const handleEdit = (item) => {
    console.log("=== HANDLE EDIT CLICKED ===");
    console.log("Edit item:", item);
    console.log("Item ID:", item?.id);
    console.log("Item title:", item?.title);
    console.log("Item description:", item?.description);
    setSelectedProject(item);
    setEditModalOpen(true);
    console.log("EditModal should now be open");
  };

  // Example handleDelete function with placeholder fetch
  const handleDelete = async (item) => {
    toast.warn(
      <div>
        <p>Are you sure you want to delete this item?</p>
        <div style={{ marginTop: "10px" }}>
          <button
            onClick={() => {
              performDelete(item);
              toast.dismiss();
            }}
            style={{
              marginRight: "10px",
              padding: "5px 10px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "3px",
            }}
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss()}
            style={{
              padding: "5px 10px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "3px",
            }}
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        hideProgressBar: true,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

  const performDelete = async (item) => {
    console.log("Delete item:", item);

    try {
      // Delete project via API
      const response = await deleteProjectAPI(item.id);

      console.log("Delete response:", response);

      // Check if deletion was successful
      if (response.success || response.message) {
        console.log("Item deleted successfully");
        toast.success("Item deleted successfully!");
        // Automatically refresh the project list after successful deletion
        if (onProjectCreated) {
          await onProjectCreated();
        }
      } else {
        console.error("Failed to delete item");
        toast.error("Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Error deleting item: " + error.message);
    }
  };

  return (
    <div>
      {!data || data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No data available</div>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-lg">
          <table className="min-w-full bg-white border border-gray-200 table-fixed">
            {/* Table Header */}
            <thead className="bg-[#12284C]">
              <tr>
                {/* <th className="px-3 py-3 text-center text-xs font-medium text-white uppercase tracking-wider w-20">
                  Image
                </th> */}
                <th className="px-6 py-3 text-left text-sm font-medium text-white tracking-wider w-10">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-white tracking-wider w-80">
                  Description
                </th>
                <th className="px-6 py-3 text-left  text-sm font-medium text-white tracking-wider w-40">
                  Last Edit
                </th>
                <th className="px-1 py-3 text-right pr-13 text-sm font-medium text-white tracking-wider w-16">
                  Edit
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr
                  key={item.id || index}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-gray-100"}`}
                >
                  {/* <td
                    className="px-5 py-2 whitespace-nowrap w-20 "
                    onClick={() => navigate(`/Annotate/${item.id}`)} // ✅ correct
                    style={{ cursor: "pointer" }}
                  >
                    <div className="flex-shrink-0 h-12 w-12 mx-auto mb-2">
                      <img
                        className="h-14 w-14 rounded-lg object-cover border border-gray-300"
                        src={nav2}
                        alt={item.title || "Image"}
                      />
                    </div>
                  </td> */}

                  {/* Title Column */}
                  <td
                    className="px-6 py-4 w-10"
                    onClick={() => navigate(`/Annotate/${item.id}`)} // ✅ correct
                    style={{ cursor: "pointer" }}
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {item.name || "No title"}
                    </div>
                  </td>

                  {/* Description Column */}
                  <td className="w-80">
                    <div className="text-sm text-gray-900 px-6 ">
                      <span className="mr-2 truncate">
                        {truncateDescription(item.description)}
                      </span>
                      {item.description && item.description.length > 50 && (
                        <button
                          onClick={() => showFullDescription(item.description)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded flex-shrink-0"
                        >
                          More
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Last Edit Column */}
                  <td className="px-6 py-4 whitespace-nowrap w-40">
                    <div className="text-sm text-gray-900">
                      {item.updated_at == "0001-01-01T00:00:00Z"
                        ? formatLastEdit(item.created_at)
                        : formatLastEdit(item.updated_at)}
                    </div>
                  </td>
                  {/* Actions Column */}
                  <td className="py-4 whitespace-nowrap text-sm font-medium w-32">
                    <div className="flex pr-6 justify-end items-center gap-3">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-white rounded text-xs font-medium transition-colors duration-200"
                      >
                        <MdEdit className="h-5 w-5 text-black hover:text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="text-white rounded text-xs font-medium transition-colors duration-200"
                      >
                        <MdDelete className="h-6 w-6 text-black hover:text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Description Modal */}
      <DescriptionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        description={selectedDescription}
      />

      {/* Create Project Button */}
      <div className="flex justify-end mt-4">
        <button
          onClick={() => setCreateModalOpen(true)}
          className="bg-[#F88F2D] hover:bg-[#fb9a40] text-white w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200 shadow-md"
        >
          <MdCreateNewFolder className="h-8 w-8" />
        </button>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={onProjectCreated}
      />

      {/*Edit Modal(title and description)*/}
      <EditModal
        isOpen={editModalOpen}
        onClose={handleEditModalClose}
        onEdited={onProjectEdited}
        item={selectedProject}
        type="project"
      />
    </div>
  );
};

export default ReusableTable;
