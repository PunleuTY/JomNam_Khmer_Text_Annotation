import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/I18nProvider";
import { Plus, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function CreateProjectForm({
  onCreateProject,
  showProjectsLink = true,
}) {
  const { t } = useI18n();
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = () => {
    if (!newProjectName.trim() || !newProjectDescription.trim()) {
      toast.warn(t("workspace.createProject.requiredFields"));
      return;
    }

    setIsCreating(true);

    const newProject = {
      id: `${Date.now()}`,
      name: newProjectName.trim(),
      description: newProjectDescription.trim(),
      imageCount: 0,
      annotatedCount: 0,
      updatedAt: new Date().toISOString().split("T")[0],
      status: "not-started",
    };

    onCreateProject(newProject);
    setNewProjectName("");
    setNewProjectDescription("");
    setIsCreating(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-[#F88F2D]">
            No Project Selected
          </h1>
          <p className="text-gray-600 text-lg">
            Create a new project or select an existing one to start annotating
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create New Project Card */}
          <Card className="bg-white rounded-xl shadow-md border-b-4 border-t-4 border-[#12284c]">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New Project
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
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
              <Button
                onClick={handleCreateProject}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium h-12"
                disabled={
                  !newProjectName.trim() ||
                  !newProjectDescription.trim() ||
                  isCreating
                }
              >
                {isCreating ? "Creating..." : "Create Project"}
              </Button>
            </CardContent>
          </Card>

          {/* Or Select Existing Project Card */}
          {showProjectsLink && (
            <Card className="bg-white rounded-xl shadow-md border-b-4 border-t-4 border-[#12284c]">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Select Existing Project
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Browse and select from your existing projects to continue
                  working on them.
                </p>
                <Link to="/project">
                  <Button
                    variant="outline"
                    className="w-full h-12 border-[#12284c] text-[#12284c] hover:bg-[#12284c] hover:text-white font-medium"
                  >
                    Go to Projects
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
