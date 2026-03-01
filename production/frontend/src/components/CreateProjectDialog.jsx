import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/I18nProvider";
import { toast } from "react-toastify";

export default function CreateProjectDialog({
  open,
  onOpenChange,
  onCreateProject,
}) {
  const { t } = useI18n();
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");

  const handleCreateProject = () => {
    if (!newProjectName.trim() || !newProjectDescription.trim()) {
      toast.warn(t("workspace.createProject.requiredFields"));
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

    onCreateProject(newProject);
    setNewProjectName("");
    setNewProjectDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
  );
}
