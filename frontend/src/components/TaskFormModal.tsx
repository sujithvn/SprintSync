import React, { useState, useEffect } from 'react';
import { Task, AiSuggestResponse, User } from '@/types';
import { useAuth } from '@/components/AuthContext';
import { userApi } from '@/services/api';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  task?: Task; // For editing existing task
  aiSuggestion?: AiSuggestResponse & { originalTitle: string }; // For pre-filling from AI
  mode: 'create' | 'edit' | 'ai-assisted';
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  task,
  aiSuggestion,
  mode
}) => {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    totalMinutes: 0,
    status: 'todo' as Task['status'],
    userId: currentUser?.id || 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Initialize form data based on mode
  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && task) {
      // Edit mode - populate with existing task data
      setFormData({
        title: task.title,
        description: task.description,
        totalMinutes: task.totalMinutes,
        status: task.status,
        userId: task.userId || currentUser?.id || 0
      });
    } else if (mode === 'ai-assisted' && aiSuggestion) {
      // AI-assisted mode - populate with AI suggestion
      setFormData({
        title: aiSuggestion.originalTitle || '',
        description: aiSuggestion.suggestedDescription || '',
        totalMinutes: Number(aiSuggestion.estimatedMinutes) || 0,
        status: 'todo',
        userId: currentUser?.id || 0
      });
    } else {
      // Create mode - empty form, default to current user or admin
      setFormData({
        title: '',
        description: '',
        totalMinutes: 0,
        status: 'todo',
        userId: currentUser?.id || 0
      });
    }
    
    setErrors({});
  }, [isOpen, mode, task, aiSuggestion, currentUser?.id]);

  // Fetch available users for admin user assignment
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen || !currentUser?.isAdmin) return;
      
      setLoadingUsers(true);
      try {
        const response = await userApi.getAllUsers();
        if (response.success && response.data) {
          setAvailableUsers(response.data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [isOpen, currentUser?.isAdmin]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.totalMinutes <= 0) {
      newErrors.totalMinutes = 'Estimated time must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim(),
        totalMinutes: formData.totalMinutes,
        status: formData.status,
        userId: formData.userId
      });
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      // Error handling will be managed by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'edit':
        return 'Edit Task';
      case 'ai-assisted':
        return 'Create Task from AI Suggestion';
      default:
        return 'Create New Task';
    }
  };

  const getSubmitButtonText = () => {
    if (isSubmitting) return 'Saving...';
    return mode === 'edit' ? 'Update Task' : 'Create Task';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">{getModalTitle()}</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* AI Suggestion Notice */}
        {mode === 'ai-assisted' && (
          <div className="p-4 bg-purple-50 border-b">
            <div className="flex items-center gap-2 text-purple-700">
              <span>🤖</span>
              <span className="text-sm font-medium">
                This task was created from an AI suggestion. You can modify any details before saving.
              </span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter a concise task title"
              disabled={isSubmitting}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Provide detailed description of the task"
              disabled={isSubmitting}
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Estimated Time */}
          <div>
            <label htmlFor="totalMinutes" className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Time (minutes) *
            </label>
            <input
              id="totalMinutes"
              type="number"
              min="1"
              value={formData.totalMinutes}
              onChange={(e) => setFormData({ ...formData, totalMinutes: parseInt(e.target.value) || 0 })}
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.totalMinutes ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Estimated time in minutes"
              disabled={isSubmitting}
            />
            {errors.totalMinutes && <p className="text-red-500 text-sm mt-1">{errors.totalMinutes}</p>}
          </div>

          {/* User Assignment (only show for admin users) */}
          {currentUser?.isAdmin && (
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                Assign to User
              </label>
              {loadingUsers ? (
                <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                  Loading users...
                </div>
              ) : (
                <select
                  id="userId"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: parseInt(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} {user.isAdmin ? '(Admin)' : ''} {user.skills ? `- ${user.skills}` : ''}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Select which user this task should be assigned to
              </p>
            </div>
          )}

          {/* Status (only show for edit mode) */}
          {mode === 'edit' && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {getSubmitButtonText()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;
