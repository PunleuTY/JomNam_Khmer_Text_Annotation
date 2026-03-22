"use client";

import { useState, useRef, useEffect } from "react";
import {
  loadProjectAPI,
  getTotalImagesAllProjectsAPI,
  getProjectStatsAPI,
} from "../server/saveResultAPI";
import { deleteProjectAPI } from "../server/deleteAPI";
import { editProjectAPI } from "../server/getProjectResult";
import { createProjectAPI } from "@/server/saveResultAPI";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import {
  FolderOpen,
  Plus,
  Search,
  ImageIcon,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Activity,
  ChevronDown,
  TrendingUp,
  Edit3,
  Trash2,
} from "lucide-react";
import { MdSmsFailed } from "react-icons/md";
import { useI18n } from "@/components/I18nProvider";
import Footer from "../components/Footer";
import { toast } from "react-toastify";

export default function WorkspacePage() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalImages, setTotalImages] = useState({
    total_images: 0,
    annotated_images: 0,
  });
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [completionRate, setCompletionRate] = useState(0);
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    status: "not-started",
  });
  const [editing, setEditing] = useState(false);
  // Status change state
  const [statusChangeModalOpen, setStatusChangeModalOpen] = useState(false);
  const [projectForStatusChange, setProjectForStatusChange] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [changingStatus, setChangingStatus] = useState(false);
  const STORAGE_KEY = "selectedProjectId";

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      try {
        const projectsRes = await loadProjectAPI();
        const totalRes = await getTotalImagesAllProjectsAPI();

        if (!projectsRes || !projectsRes.success) {
          const msg = projectsRes?.error || "Failed to load projects";
          throw new Error(msg);
        }

        const data = projectsRes.data || [];

        const totals =
          totalRes && totalRes.success && totalRes.data
            ? totalRes.data
            : { total_images: 0, annotated_images: 0 };
        setTotalImages(totals);
        setProjects(data);
        // compute completion from freshly fetched totals (use `totals`, not state)
        const progressValue = totals.total_images
          ? Math.round(
              ((totals.annotated_images || 0) / totals.total_images) * 100,
            )
          : 0;
        setCompletionRate(progressValue);
        console.log(progressValue);
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  // Note: project loading handled by fetchProjects and explicit calls to `loadProjects`

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectsRes = await loadProjectAPI();
      if (!projectsRes || !projectsRes.success) {
        const msg = projectsRes?.error || "Failed to load projects";
        throw new Error(msg);
      }
      // Transform backend data to match frontend format
      const projectsData = projectsRes.data || [];
      const transformedProjects = projectsData.map((project) => ({
        id: project._id || project.id,
        name: project.name,
        description: project.description || "",
        imageCount: 0, // Will be updated when we have image count API
        annotatedCount: 0,
        updatedAt: project.updated_at
          ? new Date(project.updated_at).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        status:
          project.status === "active"
            ? "in-progress"
            : project.status || "not-started",
      }));
      setProjects(transformedProjects);
    } catch (err) {
      console.error("Failed to load projects:", err);
      setError("Failed to load projects. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: projects.length,
    inProgress: projects.filter((p) => p.status === "in-progress").length,
    completed: projects.filter((p) => p.status === "completed").length,
    totalImages: projects.reduce((sum, p) => sum + p.imageCount, 0),
    totalAnnotated: projects.reduce((sum, p) => sum + p.annotatedCount, 0),
  };

  // const handleCreateProject = (newProject) => {
  //   setProjects([newProject, ...projects]);}

  // const completionRate = Math.round(
  //   (stats.totalAnnotated / stats.totalImages) * 100
  // );

  const handleCreateProject = async (newProjectData) => {
    try {
      const res = await createProjectAPI(
        newProjectData.name,
        newProjectData.description,
      );
      if (!res || !res.success) {
        const msg = res?.error || "Failed to create project";
        throw new Error(msg);
      }
      // Reload projects to get the updated list
      await loadProjects();
      toast.success("Project created successfully!");
    } catch (err) {
      console.error("Failed to create project:", err);
      const errorMessage = "Failed to create project. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Handle editing a project: open edit modal
  const handleEditProject = (project) => {
    if (!project) return;
    setProjectToEdit(project);
    setEditFormData({
      name: project.name || "",
      description: project.description || "",
      status: project.status || "not-started",
    });
    setSelectedProject(project);
    setEditFormData({ name: project.name, description: project.description });
    setEditModalOpen(true);
  };

  // Confirm edit (called from modal)
  async function confirmEditProject() {
    if (!projectToEdit) return;
    setEditing(true);
    try {
      const response = await editProjectAPI(
        projectToEdit.id || projectToEdit._id,
        editFormData,
      );

      if (response && response.success) {
        // Update the project in the list
        setProjects((prev) =>
          prev.map((p) =>
            (p.id || p._id) === (projectToEdit.id || projectToEdit._id)
              ? { ...p, ...editFormData }
              : p,
          ),
        );
      } else {
        console.error("Failed to update project", response);
        setError(response?.error || "Failed to update project");
      }
    } catch (err) {
      console.error("Error updating project", err);
      setError("Error updating project");
    } finally {
      setEditing(false);
      setEditModalOpen(false);
      setProjectToEdit(null);
      setEditFormData({ name: "", description: "", status: "not-started" });
    }
  }

  function cancelEditProject() {
    setEditModalOpen(false);
    setProjectToEdit(null);
    setEditFormData({ name: "", description: "", status: "not-started" });
  }

  // Handle deleting a project: open confirmation modal
  const handleDeleteProject = (project) => {
    if (!project) return;
    setProjectToDelete(project);
    setDeleteModalOpen(true);
    setSelectedProject(project);
    setDeleteModalOpen(true);
  };

  // Handle status change: open status change modal
  const handleQuickStatusChange = (project) => {
    if (!project) return;
    setProjectForStatusChange(project);
    setNewStatus(project.status || "not-started");
    setStatusChangeModalOpen(true);
  };

  // Confirm status change
  async function confirmStatusChange() {
    if (!projectForStatusChange || !newStatus) return;
    setChangingStatus(true);
    try {
      const response = await editProjectAPI(
        projectForStatusChange.id || projectForStatusChange._id,
        {
          status: newStatus,
          name: projectForStatusChange.name,
          description: projectForStatusChange.description,
        },
      );

      if (response && response.success) {
        // Update the project in the list
        setProjects((prev) =>
          prev.map((p) =>
            (p.id || p._id) === (projectForStatusChange.id || projectForStatusChange._id)
              ? { ...p, status: newStatus }
              : p,
          ),
        );
        toast.success(
          `Project status updated to ${newStatus.replace("-", " ")}!`,
        );
        setStatusChangeModalOpen(false);
        setProjectForStatusChange(null);
        setNewStatus("");
      } else {
        console.error("Failed to update status", response);
        toast.error(response?.error || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status", err);
      toast.error("Error updating status");
    } finally {
      setChangingStatus(false);
    }
  }

  function cancelStatusChange() {
    setStatusChangeModalOpen(false);
    setProjectForStatusChange(null);
    setNewStatus("");
  }

  // Save edited project
  const handleSaveEdit = async () => {
    if (!selectedProject) return;

    try {
      const res = await editProjectAPI(selectedProject.id, {
        name: editFormData.name,
        description: editFormData.description,
        status:
          selectedProject.status === "in-progress"
            ? "active"
            : selectedProject.status,
      });
      if (!res || !res.success) {
        throw new Error(res?.error || "Failed to update project");
      }

      // Update local state
      const updatedProjects = projects.map((project) =>
        project.id === selectedProject.id
          ? {
              ...project,
              name: editFormData.name,
              description: editFormData.description,
            }
          : project,
      );
      setProjects(updatedProjects);
      setEditModalOpen(false);
      setSelectedProject(null);
      toast.success("Project updated successfully!");
    } catch (err) {
      console.error("Failed to update project:", err);
      const errorMessage = "Failed to update project. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Confirm delete project
  const handleConfirmDelete = async () => {
    if (!selectedProject) return;

    try {
      const res = await deleteProjectAPI(selectedProject.id);
      if (!res || !res.success) {
        throw new Error(res?.error || "Failed to delete project");
      }

      // Update local state
      const updatedProjects = projects.filter(
        (project) => project.id !== selectedProject.id,
      );
      setProjects(updatedProjects);
      setDeleteModalOpen(false);
      setSelectedProject(null);
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && stored === String(selectedProject.id)) {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.warn("Failed to clear selected project from storage", e);
      }
      toast.success("Project deleted successfully!");
    } catch (err) {
      console.error("Failed to delete project:", err);
      const errorMessage = "Failed to delete project. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Confirm deletion (called from modal)
  async function confirmDeleteProject() {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      const response = await deleteProjectAPI(
        projectToDelete.id || projectToDelete._id,
      );

      // require explicit success
      if (response && response.success) {
        setProjects((prev) =>
          prev.filter(
            (p) =>
              (p.id || p._id) !== (projectToDelete.id || projectToDelete._id),
          ),
        );

        // refresh global totals from server
        try {
          const totalsRes = await getTotalImagesAllProjectsAPI();
          const totals =
            totalsRes && totalsRes.success && totalsRes.data
              ? totalsRes.data
              : { total_images: 0, annotated_images: 0 };
          setTotalImages(totals);
          const progressValue =
            totals && totals.total_images
              ? Math.round(
                  ((totals.annotated_images || 0) / totals.total_images) * 100,
                )
              : 0;
          setCompletionRate(progressValue);
        } catch (e) {
          console.warn("Failed to refresh totals after delete", e);
        }
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (
            stored &&
            stored === String(projectToDelete.id || projectToDelete._id)
          ) {
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch (e) {
          console.warn("Failed to clear selected project from storage", e);
        }
      } else {
        console.error("Failed to delete project", response);
        setError("Failed to delete project");
      }
    } catch (err) {
      console.error("Error deleting project", err);
      setError("Error deleting project");
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setProjectToDelete(null);
    }
  }

  function cancelDeleteProject() {
    setDeleteModalOpen(false);
    setProjectToDelete(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading/Error indicators at top */}
      {loading && (
        <div className="text-center py-10 text-lg text-gray-500">
          Loading projects...
        </div>
      )}
      {error && (
        <div className="text-center py-10 text-lg text-red-500">{error}</div>
      )}
      {!loading && !error && (
        <>
          {/* Header Section */}
          <header>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
              <h1 className="text-3xl md:text-5xl font-cadt text-[#F88F2D] mb-3">
                Project Workspace
              </h1>
              <p className="text-gray-600 text-lg">
                {t("Manage your annotation projects and datasets")}
              </p>
            </div>
          </header>

          {/* Project Statistics */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              icon={<FolderOpen />}
              label="Total Projects"
              value={stats.total}
              color="bg-slate-800"
            />
            <StatCard
              icon={<Activity />}
              label="In Progress"
              value={stats.inProgress}
              color="bg-amber-900"
            />
            <StatCard
              icon={<CheckCircle2 />}
              label="Completed"
              value={stats.completed}
              color="bg-emerald-900"
            />
            <StatCard
              icon={<ImageIcon />}
              label="Total Images"
              value={totalImages.total_images}
              color="bg-slate-800"
            />
            <StatCard
              icon={<TrendingUp />}
              label="Completion Rate"
              value={`${completionRate || 0}%`}
              color="bg-slate-800"
              sub={`${totalImages.annotated_images} annotated`}
            />
          </section>

          {/* Search & Filter Bar */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder={t("Search your projects...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-gray-300"
              />
            </div>
            <div className="relative w-56">
              {/* Custom dropdown: button toggles menu to allow full styling of popup */}
              <StatusDropdown
                value={filterStatus}
                onChange={(v) => setFilterStatus(v)}
                options={[
                  { value: "all", label: t("All Status") },
                  { value: "in-progress", label: t("In Progress") },
                  { value: "completed", label: t("Completed") },
                  { value: "not-started", label: t("Not Started") },
                ]}
              />
            </div>
          </section>

          {/* Project List */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4 mb-5">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id || project._id}
                  project={project}
                  onEdit={handleEditProject}
                  onDelete={handleDeleteProject}
                  onQuickStatusChange={handleQuickStatusChange}
                />
              ))
            ) : (
              <p className="text-center text-gray-500 py-10 text-lg">
                No projects found
              </p>
            )}
          </section>

          {/* Floating Add Project Button */}
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="fixed bottom-8 right-8 w-16 h-16 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110"
          >
            <Plus className="w-8 h-8" />
          </button>

          {/* Create Project Dialog */}
          <CreateProjectDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onCreateProject={handleCreateProject}
          />
          {/* Delete confirmation modal */}
          {deleteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black opacity-40"
                onClick={cancelDeleteProject}
              />
              <div className="bg-white rounded-lg shadow-xl z-10 w-full max-w-md p-6">
                <h3 className="text-lg font-semibold mb-2">Confirm Deletion</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Are you sure you want to delete the project
                  <span className="font-medium"> {projectToDelete?.name}</span>?
                  This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={cancelDeleteProject}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={confirmDeleteProject}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Edit project modal */}
          {editModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black opacity-40"
                onClick={cancelEditProject}
              />
              <div className="bg-white rounded-lg shadow-xl z-10 w-full max-w-md p-6">
                <h3 className="text-lg font-semibold mb-4">Edit Project</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Name
                    </label>
                    <Input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          name: e.target.value,
                        })
                      }
                      placeholder="Project name"
                      className="w-full"
                      disabled={editing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <Input
                      type="text"
                      value={editFormData.description}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Project description"
                      className="w-full"
                      disabled={editing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          status: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#12284c]"
                      disabled={editing}
                    >
                      <option value="not-started">Not Started</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={cancelEditProject}
                    disabled={editing}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-[#12284c] hover:bg-[#0a1f38] text-white"
                    onClick={confirmEditProject}
                    disabled={editing}
                  >
                    {editing ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Status Change Modal */}
          {statusChangeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black opacity-40"
                onClick={cancelStatusChange}
              />
              <div className="bg-white rounded-lg shadow-xl z-10 w-full max-w-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#F88F2D]" />
                  Update Project Status
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Project: <span className="font-semibold">{projectForStatusChange?.name}</span>
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select New Status
                  </label>
                  <div className="space-y-3">
                    {[
                      { value: "not-started", label: "Not Started", color: "bg-gray-100 border-gray-300 hover:bg-gray-200" },
                      { value: "in-progress", label: "In Progress", color: "bg-orange-100 border-orange-300 hover:bg-orange-200" },
                      { value: "completed", label: "Completed", color: "bg-emerald-100 border-emerald-300 hover:bg-emerald-200" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setNewStatus(option.value)}
                        disabled={changingStatus}
                        className={`w-full p-3 rounded-lg border-2 font-medium transition-all ${
                          newStatus === option.value
                            ? `${option.color} border-2 border-blue-500 ring-2 ring-blue-200`
                            : `${option.color} border-2`
                        } ${changingStatus ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={cancelStatusChange}
                    disabled={changingStatus}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-[#F88F2D] hover:bg-orange-600 text-white"
                    onClick={confirmStatusChange}
                    disabled={changingStatus || newStatus === projectForStatusChange?.status}
                  >
                    {changingStatus ? "Updating..." : "Update Status"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Footer />
        </>
      )}

      {/* Floating Add Project Button */}
      <button
        onClick={() => setCreateDialogOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110"
      >
        <Plus className="w-8 h-8" />
      </button>
      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateProject={handleCreateProject}
      />
      {/* Edit Project Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-blue-500/10"
            onClick={() => setEditModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Edit Project
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="edit-name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Project Name
                </label>
                <Input
                  id="edit-name"
                  type="text"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  placeholder="Enter project name"
                  className="w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter project description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={!editFormData.name.trim()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-blue-500/10"
            onClick={() => setDeleteModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Delete Project
            </h2>

            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">"{selectedProject?.name}"</span>?
              This action cannot be undone and all associated data will be
              permanently removed.
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                Delete Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className={`${color} rounded-2xl p-6 text-white`}>
      <div className="flex items-center gap-3 mb-2 opacity-90">{icon}</div>
      <div className="text-sm font-medium mb-1 opacity-80">{label}</div>
      <div className="text-4xl font-bold">{value}</div>
      {sub && <div className="text-xs opacity-70 mt-1">{sub}</div>}
    </div>
  );
}

function ProjectCard({ project, onEdit, onDelete, onQuickStatusChange }) {
  const [totalStats, setTotalStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const statusColors = {
    "in-progress": "bg-orange-100 text-orange-700 border-orange-300",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-300",
    "not-started": "bg-gray-100 text-gray-700 border-gray-300",
  };

  async function fetchStats(id) {
    setLoading(true);
    try {
      const res = await getProjectStatsAPI(id);
      if (!res || !res.success) {
        throw new Error(res?.error || "Failed to fetch stats");
      }
      const data = res.data || null;
      setTotalStats(data);
      // compute progress from the fetched data (use `data`, not state `totalStats`)
      const progressValue =
        data && data.total_images
          ? Math.round(((data.annotated_images || 0) / data.total_images) * 100)
          : 0;
      setProgress(progressValue);
    } catch (err) {
      console.error("Failed to fetch project stats:", err);
    } finally {
      setLoading(false);
    }
  }

  // fetch stats when the card mounts or project.id changes
  useEffect(() => {
    if (!project || !project.id) return;
    setProgress(0);
    fetchStats(project.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project && project.id]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900">{project.name}</h3>
          <p className="text-gray-600 text-sm">{project.description}</p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => onQuickStatusChange(project)}
            className={`${
              statusColors[project.status]
            } border px-3 py-1 text-sm font-medium rounded cursor-pointer hover:shadow-md transition-all hover:scale-105 active:scale-95`}
            title="Click to change status"
          >
            {project.status.replace("-", " ").toUpperCase()}
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(project)}
            className="h-8 w-8 p-0 border-gray-300 hover:border-[#F88F2D] hover:text-[#F88F2D]"
          >
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(project)}
            className="h-8 w-8 p-0 border-gray-300 hover:border-red-500 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          <span className="font-semibold">
            {loading
              ? "..."
              : (totalStats?.total_images ?? project.imageCount ?? 0)}
          </span>{" "}
          Images
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span className="font-semibold">
            {loading ? "..." : (totalStats?.annotated_images ?? 0)}
          </span>{" "}
          Annotated
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>
            Updated {new Date(project.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-bold w-12 text-right">{progress}%</span>
        <Link
          to={`/Annotate/${project.id}`}
          onClick={() => {
            try {
              localStorage.setItem("selectedProjectId", project.id);
            } catch (e) {
              /* ignore */
            }
          }}
        >
          <Button className="bg-slate-800 hover:bg-slate-900 text-white gap-2">
            Open <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function StatusDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 h-12 border border-gray-300 rounded-lg bg-white text-left text-base focus:outline-none focus:ring-2 focus:ring-[#12284c]"
      >
        <span className="truncate">{selected.label}</span>
        <ChevronDown className="w-5 h-5 text-gray-500 ml-3" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-activedescendant={selected.value}
          className="absolute right-0 left-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden"
        >
          {options.map((opt) => (
            <li key={opt.value} id={opt.value} role="option">
              <button
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-[#12284c] hover:text-white transition ${
                  opt.value === value
                    ? "bg-[#12284c] text-white"
                    : "text-gray-800"
                }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
