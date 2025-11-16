"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
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

  const handleCreateProject = () => {
    if (!newProjectName.trim() || !newProjectDescription.trim()) {
      alert(t("workspace.createProject.requiredFields"));
      return;
    }

    const newProject = {
      id: `${Date.now()}`,
      name: newProjectName.trim(),
      description: newProjectDescription.trim(),
      imageCount: 0,
      annotatedCount: 0,
      updatedAt: new Date().toISOString().split("T")[0],
      status: "not-started",
    };

    setProjects([newProject, ...projects]);
    setNewProjectName("");
    setNewProjectDescription("");
    setCreateDialogOpen(false);
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
            <ProjectCard key={project.id} project={project} />
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
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-white rounded-2xl shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Create New Project
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name" className="text-sm font-medium">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="project-name"
                placeholder="Enter your project title (e.g., Khmer OCR Dataset)"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="h-12 text-base"
                required
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="project-description"
                className="text-sm font-medium"
              >
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="project-description"
                placeholder="Briefly describe the project purpose or dataset (max 300 characters)"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                rows={4}
                className="resize-none text-base"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium"
              disabled={!newProjectName.trim() || !newProjectDescription.trim()}
            >
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function ProjectCard({ project }) {
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
        <div>
          <h3 className="font-bold text-lg text-gray-900">{project.name}</h3>
          <p className="text-gray-600 text-sm">{project.description}</p>
        </div>
        <Badge
          className={`${
            statusColors[project.status]
          } border px-3 py-1 text-sm font-medium`}
        >
          {project.status.replace("-", " ").toUpperCase()}
        </Badge>
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
