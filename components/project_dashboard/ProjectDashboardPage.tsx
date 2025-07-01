import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import LeftSidebarComponent from './LeftSidebarComponent';
import MainProjectContentComponent from './MainProjectContentComponent';
import RightSidebarComponent from './RightSidebarComponent';
import { Project, Task } from '../../types'; 

interface ProjectDashboardPageProps {
  projects: Project[];
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void; 
  onAddProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => void;
  onEditProjectRequest: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onEditTaskRequest: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const ProjectDashboardPage: React.FC<ProjectDashboardPageProps> = ({ 
  projects, 
  tasks, 
  onAddTask,
  onAddProject,
  onEditProjectRequest,
  onDeleteProject,
  onEditTaskRequest,
  onDeleteTask
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryProjectId = searchParams.get('projectId');
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(queryProjectId);

  useEffect(() => {
    // If queryProjectId exists and is different from current selectedProjectId, update selection
    if (queryProjectId && queryProjectId !== selectedProjectId) {
      setSelectedProjectId(queryProjectId);
    } else if (!queryProjectId && projects.length > 0 && !selectedProjectId) {
      // If no query param, but projects exist and nothing selected, select first project
      setSelectedProjectId(projects[0].id);
    } else if (projects.length > 0 && selectedProjectId && !projects.find(p => p.id === selectedProjectId)) {
      // If selected project is no longer in the list (e.g. deleted), select the first one if available
       setSelectedProjectId(projects[0].id);
       setSearchParams({ projectId: projects[0].id });
    } else if (projects.length === 0) {
      setSelectedProjectId(null); // No projects, so no selection
      if (queryProjectId) setSearchParams({}); // Clear query param if no projects
    }
  }, [projects, queryProjectId, selectedProjectId, setSearchParams]);


  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSearchParams({ projectId });
  };

  const selectedProjectData = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const selectedProjectTasks = useMemo(() => {
    if (!selectedProjectId) return [];
    return tasks.filter(task => task.project_id === selectedProjectId);
  }, [tasks, selectedProjectId]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <LeftSidebarComponent 
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
        onAddProject={onAddProject}
        onEditProjectRequest={onEditProjectRequest}
        onDeleteProject={onDeleteProject}
      />
      <MainProjectContentComponent 
        project={selectedProjectData}
        tasks={selectedProjectTasks} 
        allTasksForProjectContext={tasks} 
        onAddTask={onAddTask} 
        allProjects={projects} 
        onEditTaskRequest={onEditTaskRequest}
        onDeleteTask={onDeleteTask}
      />
      <RightSidebarComponent />
    </div>
  );
};

export default ProjectDashboardPage;
