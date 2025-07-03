import React, { useState, useRef } from 'react';
import { Project } from '../../../types';
import { useAppState } from '../../contexts/AppStateContext';

interface DocumentFileLocalState {
  id: string;
  name: string;
  type: string;
  size: number;
  project_id?: string; // snake_case
  upload_date: string; // snake_case
}

interface DocumentsPageProps {
  onNavigate: (page: string) => void;
}

// Note: PlusIcon component removed - not currently used in UI
const UploadIcon: React.FC = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
</svg>
);
const DownloadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const DocumentsPage: React.FC<DocumentsPageProps> = () => {
  const { state } = useAppState();
  const { projects } = state;

  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('All Projects');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [documents, setDocuments] = useState<DocumentFileLocalState[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedProjectForImport, setSelectedProjectForImport] = useState<string | undefined>(projects.length > 0 ? projects[0].id : undefined);


  const handleFileImportClick = () => {
    if (!selectedProjectForImport && projects.length > 0) {
        alert("Please select a project to associate the file with.");
        return;
    }
    if (projects.length === 0) {
        alert("Please create a project first before importing documents.");
        return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedProjectForImport) {
      const newDoc: DocumentFileLocalState = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type || 'unknown',
        size: file.size,
        project_id: selectedProjectForImport, // snake_case
        upload_date: new Date().toISOString(), // snake_case
      };
      setDocuments(prevDocs => [...prevDocs, newDoc]);
      console.log('Imported file:', file.name, 'for project:', selectedProjectForImport);
      if(fileInputRef.current) fileInputRef.current.value = "";
    } else if (!selectedProjectForImport) {
        console.warn("No project selected for import.");
    }
  };

  const handleExportFile = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (doc) {
      const blob = new Blob([`Mock content for ${doc.name}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log(`Mock export for: ${doc.name}.`);
    }
  };

  const getDocumentsByProject = (pId?: string) => {
    return documents.filter(doc => doc.project_id === pId); // snake_case
  };

  const displayedProjects = projects.map((p: Project) => ({
    ...p,
    docs: getDocumentsByProject(p.id),
    chatTranscripts: []
  }));


  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-slate-900 text-slate-100">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-slate-400 mt-1">Project files, emails, chats, and AI conversation transcripts.</p>
        </div>
        <div className="flex space-x-2 flex-wrap gap-2">
          <select
            value={selectedProjectForImport || ''}
            onChange={(e) => setSelectedProjectForImport(e.target.value)}
            className="bg-slate-700 border-slate-600 rounded-md text-sm py-2 px-3 focus:ring-sky-500 focus:border-sky-500 h-10"
            aria-label="Select project for import"
            title="Select project for importing documents"
            disabled={projects.length === 0}
            >
            {projects.length === 0 && <option value="" disabled>No projects to import to</option>}
            {projects.map(p => <option key={p.id} value={p.id}>Import to: {p.title}</option>)}
          </select>
          <button
            onClick={handleFileImportClick}
            disabled={projects.length === 0 || (!selectedProjectForImport && projects.length > 0)}
            className="bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-3 rounded-lg flex items-center text-sm h-10 disabled:opacity-50 disabled:cursor-not-allowed"
           >
            <UploadIcon /> <span className="ml-2">Import File</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" aria-label="Select file to import" title="File input for document import" />
          <button onClick={() => alert("Export functionality placeholder")} className="bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium py-2 px-3 rounded-lg flex items-center text-sm h-10">
            <DownloadIcon /> <span className="ml-2">Export File(s)</span>
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3 items-center">
         <div className="relative flex-grow sm:flex-grow-0 sm:w-auto">
          <label htmlFor="document-search" className="sr-only">Search documents and chats</label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search documents and chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-md leading-5 bg-slate-700 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            aria-label="Search documents and chats"
            id="document-search"
            title="Search through documents and chat transcripts"
          />
        </div>
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="bg-slate-700 border-slate-600 rounded-md text-sm py-2 px-3 focus:ring-sky-500 focus:border-sky-500" aria-label="Filter by project" title="Filter documents by project">
          <option value="All Projects">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-slate-700 border-slate-600 rounded-md text-sm py-2 px-3 focus:ring-sky-500 focus:border-sky-500" aria-label="Filter by type" title="Filter documents by file type" disabled>
          <option>All Types</option>
        </select>
      </div>

      <div className="space-y-6">
        {displayedProjects.filter(p => projectFilter === 'All Projects' || p.id === projectFilter).map(project => (
          <div key={project.id} className="bg-slate-800 rounded-lg">
            <details open className="group">
              <summary className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-700/80 rounded-t-lg">
                <h3 className="text-lg font-semibold text-slate-100">{project.title}</h3>
                <span className="text-sm text-slate-400">
                  {project.docs.length + project.chatTranscripts.length} items
                  <svg className="w-5 h-5 inline ml-2 transform group-open:rotate-180 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </span>
              </summary>
              <div className="border-t border-slate-700 p-4">
                <div className="mb-4 border-b border-slate-600">
                    <nav className="-mb-px flex space-x-4" role="tablist" aria-label="Document tabs">
                        <button className="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm border-sky-500 text-sky-400" role="tab" aria-selected="true" id={`docs-tab-${project.id}`} aria-controls={`docs-panel-${project.id}`} title="View documents">
                            Documents ({project.docs.length})
                        </button>
                        <button className="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-400" role="tab" aria-selected="false" id={`chats-tab-${project.id}`} aria-controls={`chats-panel-${project.id}`} title="View chat transcripts">
                            Chat Transcripts ({project.chatTranscripts.length})
                        </button>
                    </nav>
                </div>
                <div role="tabpanel" id={`docs-panel-${project.id}`} aria-labelledby={`docs-tab-${project.id}`}>
                  {project.docs.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No documents in this project yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {project.docs.map(doc => (
                        <li key={doc.id} className="flex justify-between items-center p-3 bg-slate-700/50 rounded-md hover:bg-slate-600/50">
                          <div>
                            <p className="font-medium text-slate-200">{doc.name}</p>
                            <p className="text-xs text-slate-400">
                              {(doc.size / 1024).toFixed(1)} KB - {new Date(doc.upload_date).toLocaleDateString()} {/* snake_case */}
                            </p>
                          </div>
                          <button onClick={() => handleExportFile(doc.id)} className="text-sky-400 hover:text-sky-300 text-sm" aria-label={`Export document ${doc.name}`} title="Export this document">Export</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </details>
          </div>
        ))}
        {documents.length === 0 && (projectFilter === 'All Projects' || !projects.find(p=>p.id === projectFilter)) && (
            <div className="text-center py-20 bg-slate-800 rounded-lg">
                 <svg className="mx-auto h-12 w-12 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.125.75H12m0 0v.093c0 .655.53 1.185 1.185 1.185h.975c.655 0 1.185-.53 1.185-1.185V5.25m0 0h3.17c.621 0 1.125.504 1.125 1.125V12M10.5 5.25h-3.375a1.125 1.125 0 00-1.125 1.125v12.75c0 .621.504 1.125 1.125 1.125h11.25c.621 0 1.125-.504 1.125-1.125V7.875M10.5 5.25H8.25m5.25 0h-2.25m0 0v2.25m0 0h2.25" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-slate-300">No documents found</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {projects.length === 0 ? "Create a project first, then " : ""}
                  Import your first document to get started.
                </p>
             </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
