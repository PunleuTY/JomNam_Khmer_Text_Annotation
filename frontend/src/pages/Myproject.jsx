"use client";

import { useState, useRef, useEffect } from "react";
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

// Import API functions
import { loadProjectAPI, createProjectAPI } from "@/server/saveResultAPI";
import { editProjectAPI } from "@/server/getProjectResult";
import { deleteProjectAPI } from "@/server/deleteAPI";

export default function WorkspacePage() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
  });

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectsData = await loadProjectAPI();
      // Transform backend data to match frontend format
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
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
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

  const completionRate = Math.round(
    (stats.totalAnnotated / stats.totalImages) * 100
  );

  const handleCreateProject = async (newProjectData) => {
    try {
      await createProjectAPI(newProjectData.name, newProjectData.description);
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

  // Handle editing a project
  const handleEditProject = (project) => {
    setSelectedProject(project);
    setEditFormData({ name: project.name, description: project.description });
    setEditModalOpen(true);
  };

  // Handle deleting a project
  const handleDeleteProject = (project) => {
    setSelectedProject(project);
    setDeleteModalOpen(true);
  };

  // Save edited project
  const handleSaveEdit = async () => {
    if (!selectedProject) return;

    try {
      await editProjectAPI(selectedProject.id, {
        name: editFormData.name,
        description: editFormData.description,
        status:
          selectedProject.status === "in-progress"
            ? "active"
            : selectedProject.status,
      });

      // Update local state
      const updatedProjects = projects.map((project) =>
        project.id === selectedProject.id
          ? {
              ...project,
              name: editFormData.name,
              description: editFormData.description,
            }
          : project
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
      await deleteProjectAPI(selectedProject.id);

      // Update local state
      const updatedProjects = projects.filter(
        (project) => project.id !== selectedProject.id
      );
      setProjects(updatedProjects);
      setDeleteModalOpen(false);
      setSelectedProject(null);
      toast.success("Project deleted successfully!");
    } catch (err) {
      console.error("Failed to delete project:", err);
      const errorMessage = "Failed to delete project. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
          value={stats.totalImages}
          color="bg-slate-800"
        />
        <StatCard
          icon={<TrendingUp />}
          label="Completion Rate"
          value={`${completionRate || 0}%`}
          color="bg-slate-800"
          sub={`${stats.totalAnnotated} annotated`}
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

      {/* Error Message */}
      {error && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <MdSmsFailed />
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null);
                loadProjects();
              }}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        </section>
      )}

      {/* Project List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4 mb-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-gray-500 text-lg">Loading projects...</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
            />
          ))
        ) : (
          <div className="text-center py-20">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {searchQuery || filterStatus !== "all"
                ? "No projects match your search"
                : "No projects yet"}
            </p>
            <p className="text-gray-400 text-sm mb-6">
              {searchQuery || filterStatus !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Create your first project to get started"}
            </p>
            {!searchQuery && filterStatus === "all" && (
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Project
              </Button>
            )}
          </div>
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

      {/* Footer removed from individual project cards */}
      <Footer />
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

function ProjectCard({ project, onEdit, onDelete }) {
  const progress = project.imageCount
    ? Math.round((project.annotatedCount / project.imageCount) * 100)
    : 0;
  const statusColors = {
    "in-progress": "bg-orange-100 text-orange-700 border-orange-300",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-300",
    "not-started": "bg-gray-100 text-gray-700 border-gray-300",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900">{project.name}</h3>
          <p className="text-gray-600 text-sm">{project.description}</p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Badge
            className={`${
              statusColors[project.status]
            } border px-3 py-1 text-sm font-medium`}
          >
            {project.status.replace("-", " ").toUpperCase()}
          </Badge>
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
          <span className="font-semibold">{project.imageCount}</span> Images
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span className="font-semibold">{project.annotatedCount}</span>{" "}
          Annotated
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>
            Updated {new Date(project.updatedAt).toLocaleDateString()}
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
        <Link to={`/Annotate/${project.id}`}>
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
