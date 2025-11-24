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
import { useI18n } from "@/components/I18nProvider";
import Footer from "../components/Footer";

const sampleProjects = [
  {
    id: "1",
    name: "Khmer Historical Documents",
    description:
      "Ancient Khmer manuscripts and historical texts for OCR training dataset",
    imageCount: 255,
    annotatedCount: 180,
    updatedAt: "2025-10-29",
    status: "in-progress",
  },
  {
    id: "2",
    name: "Modern Khmer Newspapers",
    description:
      "Contemporary newspaper articles and headlines for text detection models",
    imageCount: 512,
    annotatedCount: 512,
    updatedAt: "2025-10-28",
    status: "completed",
  },
];

export default function WorkspacePage() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [projects, setProjects] = useState(sampleProjects);

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

  const handleCreateProject = (newProject) => {
    setProjects([newProject, ...projects]);
  };

  // Handle editing a project
  const handleEditProject = (project) => {
    // TODO: Implement project edit functionality
    console.log("Edit project:", project);
  };

  // Handle deleting a project
  const handleDeleteProject = (project) => {
    // TODO: Implement project delete functionality
    console.log("Delete project:", project);
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

      {/* Project List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4 mb-5">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
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
        <Link to={`/annotate?project=${project.id}`}>
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
