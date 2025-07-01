
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewProjectModal from './NewProjectModal';
import { ProjectStatus, ProjectContext } from '../../types';

describe('NewProjectModal', () => {
  const mockOnClose = jest.fn();
  const mockOnAddProject = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnAddProject.mockClear();
  });

  const renderModal = (isOpen = true) => {
    render(
      <NewProjectModal
        isOpen={isOpen}
        onClose={mockOnClose}
        onAddProject={mockOnAddProject}
      />
    );
  };

  it('does not render when isOpen is false', () => {
    renderModal(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders correctly when isOpen is true', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByText('Create New Project')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: /Close modal/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking outside the modal content (on the backdrop)', () => {
    renderModal();
    // The dialog itself is the backdrop in this modal's structure when using getByRole('dialog')
    fireEvent.click(screen.getByRole('dialog'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside the modal content', () => {
    renderModal();
    // Simulate click on the modal's inner div (the one that stops propagation)
    // We can get it by its role as 'dialog' and then its first child, or a more specific selector
    const modalContent = screen.getByRole('dialog').firstChild as HTMLElement;
    fireEvent.click(modalContent);
    expect(mockOnClose).not.toHaveBeenCalled();
  });
  
  it('updates input fields as user types', async () => {
    const user = userEvent.setup();
    renderModal();

    const titleInput = screen.getByLabelText(/Title/i);
    await user.type(titleInput, 'New Awesome Project');
    expect(titleInput).toHaveValue('New Awesome Project');

    const descriptionInput = screen.getByLabelText(/Description/i);
    await user.type(descriptionInput, 'This is a description.');
    expect(descriptionInput).toHaveValue('This is a description.');
  });

  it('shows an error if title is submitted empty', async () => {
    const user = userEvent.setup();
    renderModal();
    
    const submitButton = screen.getByRole('button', { name: /Create Project/i });
    await user.click(submitButton);

    expect(mockOnAddProject).not.toHaveBeenCalled();
    expect(screen.getByText('Title is required.')).toBeInTheDocument();
  });

  it('calls onAddProject with correct data on successful submission', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/Title/i), 'Test Project');
    await user.type(screen.getByLabelText(/Description/i), 'Test Description');
    await user.type(screen.getByLabelText(/Goals/i), 'Goal 1\nGoal 2');
    await user.type(screen.getByLabelText(/Deadline/i), '2025-12-31');
    await user.selectOptions(screen.getByLabelText(/Status/i), ProjectStatus.ON_HOLD);
    await user.selectOptions(screen.getByLabelText(/Context/i), ProjectContext.PERSONAL);
    await user.type(screen.getByLabelText(/Tags/i), 'test, api');

    const submitButton = screen.getByRole('button', { name: /Create Project/i });
    await user.click(submitButton);
    
    expect(mockOnAddProject).toHaveBeenCalledTimes(1);
    expect(mockOnAddProject).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Project',
        description: 'Test Description',
        goals: ['Goal 1', 'Goal 2'],
        deadline: '2025-12-31',
        status: ProjectStatus.ON_HOLD,
        context: ProjectContext.PERSONAL,
        tags: ['test', 'api'],
      })
    );
    // Note: The modal might close itself or be closed by the parent via onAddProject.
    // If it closes itself, onClose would also be called. Here, App.tsx handles closing.
  });

  it('validates deadline format (basic check for date input)', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText(/Title/i), 'Project With Invalid Date');
    const deadlineInput = screen.getByLabelText(/Deadline/i);
    // Date inputs usually prevent truly "invalid" text, but type="date" has its own validation.
    // We'll simulate setting a value that might fail internal parsing if not a valid date string.
    // For this test, we assume a valid date format from the input type="date".
    // If the requirement was to parse arbitrary strings, more robust testing would be needed.
    // Let's test providing an empty string after a value.
    await user.type(deadlineInput, '2025-01-01');
    await user.clear(deadlineInput); // Clear to ensure it becomes undefined

    await user.type(screen.getByLabelText(/Title/i), 'Another Project'); // Ensure title is valid
    await user.click(screen.getByRole('button', { name: /Create Project/i }));

    expect(mockOnAddProject).toHaveBeenCalledWith(
        expect.objectContaining({
            deadline: undefined, // Or null, depending on how empty date is handled
        })
    );
    // If an invalid date string was manually set that bypasses input[type=date] native validation
    // and your validation logic was different:
    // fireEvent.change(deadlineInput, { target: { value: 'invalid-date' } });
    // await user.click(screen.getByRole('button', { name: /Create Project/i }));
    // expect(screen.getByText('Invalid deadline date format.')).toBeInTheDocument();
  });

  it('resets form fields when reopened', async () => {
    const user = userEvent.setup();
    // First render and interaction
    const { rerender } = render(
      <NewProjectModal isOpen={true} onClose={mockOnClose} onAddProject={mockOnAddProject} />
    );
    await user.type(screen.getByLabelText(/Title/i), 'Initial Project Title');
    
    // Simulate closing and reopening
    rerender(
      <NewProjectModal isOpen={false} onClose={mockOnClose} onAddProject={mockOnAddProject} />
    );
    rerender(
      <NewProjectModal isOpen={true} onClose={mockOnClose} onAddProject={mockOnAddProject} />
    );

    // Check if title is reset
    expect(screen.getByLabelText(/Title/i)).toHaveValue('');
  });


});