
import React, { useState, useMemo, useEffect } from 'react';
import LeftSidebarComponent from './LeftSidebarComponent';
import MainProjectContentComponent from './MainProjectContentComponent';
import RightSidebarComponent from './RightSidebarComponent';
import { Project, Task } from '../../../types';

interface ProjectDashboardPageProps {
  projects: Project[];
  tasks: Task[];
  onAddTask: (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  onAddProject: (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  onEditProjectRequest: (project: Project) => void;
  onDeleteProject: (projectId: string) => Promise<void>;
  onEditTaskRequest: (task: Task) => void;
  onDeleteTask: (taskId: string) => Promise<void>;
  projectContextFilter?: 'all' | 'business' | 'personal';
}

const ProjectDashboardPage: React.FC<ProjectDashboardPageProps> = ({
  projects,
  tasks,
  onAddTask,
  onAddProject,
  onEditProjectRequest,
  onDeleteProject,
  onEditTaskRequest,
  onDeleteTask,
  projectContextFilter = 'all'
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const filteredProjects = useMemo(() => {
    if (projectContextFilter === 'all') return projects;
    return projects.filter(project => project.context === projectContextFilter);
  }, [projects, projectContextFilter]);

  useEffect(() => {
    if (filteredProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(filteredProjects[0].id);
    } else if (filteredProjects.length === 0) {
      setSelectedProjectId(null);
    } else if (selectedProjectId && !filteredProjects.find(p => p.id === selectedProjectId)) {
      // If current selected project is not in filtered list, select first available
      setSelectedProjectId(filteredProjects.length > 0 ? filteredProjects[0].id : null);
    }
  }, [filteredProjects, selectedProjectId]);

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    await onAddTask(taskData);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    onEditProjectRequest(updatedProject);
  };

  const selectedProjectData = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const selectedProjectTasks = useMemo(() => {
    if (!selectedProjectId) return [];
    return tasks.filter(task => task.project_id === selectedProjectId); // Corrected: was task.projectId
  }, [tasks, selectedProjectId]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <LeftSidebarComponent
        projects={filteredProjects}
        selectedProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
      />
      <MainProjectContentComponent
        project={selectedProjectData}
        tasks={selectedProjectTasks}
        allTasksForProjectContext={tasks}
        onAddTask={handleAddTask}
        onUpdateProject={handleUpdateProject}
        allProjects={projects}
      />
      <RightSidebarComponent />
    </div>
  );
};

export default ProjectDashboardPage;
