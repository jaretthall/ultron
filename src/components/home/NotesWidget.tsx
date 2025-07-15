import React, { useState, useEffect, useRef } from 'react';
import { notesService } from '../../../services/databaseService';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

interface NotesWidgetProps {
  className?: string;
}

const NotesWidget: React.FC<NotesWidgetProps> = ({ className = '' }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Load notes from database on component mount
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const loadedNotes = await notesService.getAll();
      setNotes(loadedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  // Removed localStorage saving - now using database

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editContent]);

  const createNewNote = async () => {
    try {
      const newNote = await notesService.create({
        title: 'New Note',
        content: ''
      });
      setNotes(prev => [newNote, ...prev]);
      setSelectedNote(newNote);
      setEditTitle(newNote.title);
      setEditContent(newNote.content);
      setIsEditing(true);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const saveNote = async () => {
    if (!selectedNote) return;

    try {
      const updatedNote = await notesService.update(selectedNote.id, {
        title: editTitle.trim() || 'Untitled Note',
        content: editContent
      });

      setNotes(prev => prev.map(note => 
        note.id === selectedNote.id ? updatedNote : note
      ));
      setSelectedNote(updatedNote);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      await notesService.delete(noteId);
      setNotes(prev => prev.filter(note => note.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const selectNote = (note: Note) => {
    if (isEditing) {
      saveNote();
    }
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(false);
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditTitle(selectedNote?.title || '');
    setEditContent(selectedNote?.content || '');
  };

  const cancelEditing = () => {
    setIsEditing(false);
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const applyFormatting = (format: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'heading':
        formattedText = `# ${selectedText}`;
        break;
      case 'bullet':
        formattedText = `• ${selectedText}`;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    setEditContent(newContent);

    // Set focus and cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + formattedText.length, start + formattedText.length);
      }
    }, 0);
  };

  return (
    <div className={`bg-slate-800 rounded-lg p-4 lg:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Quick Notes
        </h2>
        <button
          onClick={createNewNote}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Note
        </button>
      </div>

      {/* Data Persistence Notice */}
      <div className="mb-3 p-2 bg-green-900/30 border border-green-500/30 rounded text-xs text-green-300">
        ✅ Notes are saved in the cloud and sync across all your devices!
      </div>

      <div className={`grid gap-4 ${
        isMobile 
          ? 'grid-cols-1 h-auto' 
          : isTablet 
          ? 'grid-cols-1 h-auto' 
          : 'grid-cols-2 h-96'
      }`}>
        {/* Notes List */}
        <div className="border border-slate-600 rounded-lg overflow-hidden">
          <div className="bg-slate-700 px-3 py-2 border-b border-slate-600">
            <h3 className="text-sm font-medium text-slate-300">Notes ({notes.length})</h3>
          </div>
          <div className={`overflow-y-auto ${
            isMobile || isTablet ? 'h-64' : 'h-80'
          }`}>
            {notes.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">No notes yet</p>
                <p className="text-xs mt-1">Create your first note to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-600">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-3 cursor-pointer hover:bg-slate-700 transition-colors ${
                      selectedNote?.id === note.id ? 'bg-slate-700 border-r-2 border-blue-500' : ''
                    }`}
                    onClick={() => selectNote(note)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">
                          {note.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {note.content || 'No content'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDate(note.updated_at)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                        className="ml-2 p-1 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete note"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Note Editor */}
        <div className={`border border-slate-600 rounded-lg overflow-hidden ${
          isMobile || isTablet ? 'mt-4' : ''
        }`}>
          <div className="bg-slate-700 px-3 py-2 border-b border-slate-600">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-300">
                {selectedNote ? (isEditing ? 'Editing Note' : 'Viewing Note') : 'Select a Note'}
              </h3>
              {selectedNote && (
                <div className="flex gap-1">
                  {isEditing ? (
                    <>
                      <button
                        onClick={saveNote}
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={startEditing}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={`overflow-y-auto ${
            isMobile || isTablet ? 'h-64' : 'h-80'
          }`}>
            {selectedNote ? (
              <div className="p-3 h-full">
                {isEditing ? (
                  <div className="h-full flex flex-col">
                    {/* Formatting Toolbar */}
                    <div className="flex gap-1 mb-2 pb-2 border-b border-slate-600">
                      <button
                        onClick={() => applyFormatting('bold')}
                        className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs"
                        title="Bold"
                      >
                        <strong>B</strong>
                      </button>
                      <button
                        onClick={() => applyFormatting('italic')}
                        className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs"
                        title="Italic"
                      >
                        <em>I</em>
                      </button>
                      <button
                        onClick={() => applyFormatting('heading')}
                        className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs"
                        title="Heading"
                      >
                        H
                      </button>
                      <button
                        onClick={() => applyFormatting('bullet')}
                        className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs"
                        title="Bullet Point"
                      >
                        •
                      </button>
                    </div>

                    {/* Title Input */}
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 mb-2 text-sm"
                      placeholder="Note title..."
                    />

                    {/* Content Textarea */}
                    <textarea
                      ref={textareaRef}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full flex-1 bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 text-sm resize-none"
                      placeholder="Start typing your note... Use markdown-style formatting: **bold**, *italic*, # heading, • bullet"
                    />
                  </div>
                ) : (
                  <div className="h-full">
                    <h4 className="text-lg font-semibold text-white mb-2">
                      {selectedNote.title}
                    </h4>
                    <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedNote.content || (
                        <span className="text-slate-500 italic">No content</span>
                      )}
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-600 text-xs text-slate-500">
                      Created: {formatDate(selectedNote.created_at)}
                      {selectedNote.updated_at !== selectedNote.created_at && (
                        <span className="ml-4">
                          Updated: {formatDate(selectedNote.updated_at)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Select a note to view or edit</p>
                  <p className="text-xs mt-1">Notes are saved locally across browser sessions</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesWidget;