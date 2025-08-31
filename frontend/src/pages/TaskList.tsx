import React, { useState, useEffect } from 'react';
import { Task, AiSuggestResponse } from '@/types';
import { taskApi } from '@/services/api';
import AiSuggest from '@/components/AiSuggest';
import TaskFormModal from '@/components/TaskFormModal';

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAiAssist, setShowAiAssist] = useState(false);
  
  // Modal state
  type ModalMode = 'create' | 'edit' | 'ai-assisted';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [aiSuggestion, setAiSuggestion] = useState<(AiSuggestResponse & { originalTitle: string }) | undefined>();
  const [operationLoading, setOperationLoading] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await taskApi.getTasks();
      if (response.success && response.data) {
        setTasks(response.data);
      }
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: Task['status']) => {
    try {
      const response = await taskApi.updateTask(taskId, { status: newStatus });
      if (response.success && response.data) {
        setTasks(tasks.map(task => 
          task.id === taskId ? response.data! : task
        ));
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedTask(undefined);
    setAiSuggestion(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setModalMode('edit');
    setSelectedTask(task);
    setAiSuggestion(undefined);
    setIsModalOpen(true);
  };

  const openAiAssistedModal = (suggestion: AiSuggestResponse & { originalTitle: string }) => {
    setModalMode('ai-assisted');
    setSelectedTask(undefined);
    setAiSuggestion(suggestion);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTask(undefined);
    setAiSuggestion(undefined);
  };

  const handleTaskSubmit = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    setOperationLoading(true);
    try {
      if (modalMode === 'edit' && selectedTask) {
        // Update existing task
        const response = await taskApi.updateTask(selectedTask.id, taskData);
        if (response.success && response.data) {
          setTasks(tasks.map(task => 
            task.id === selectedTask.id ? response.data! : task
          ));
        } else {
          throw new Error(response.message || 'Failed to update task');
        }
      } else {
        // Create new task
        const response = await taskApi.createTask(taskData);
        if (response.success && response.data) {
          setTasks([...tasks, response.data]);
        } else {
          throw new Error(response.message || 'Failed to create task');
        }
      }
    } catch (err) {
      console.error('Error submitting task:', err);
      throw err; // Re-throw to let modal handle the error display
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      setOperationLoading(true);
      const response = await taskApi.deleteTask(taskId);
      if (response.success) {
        setTasks(tasks.filter(task => task.id !== taskId));
      } else {
        throw new Error(response.message || 'Failed to delete task');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task. Please try again.');
    } finally {
      setOperationLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[60vh] text-lg">Loading tasks...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-[60vh] text-lg text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* AI Assistant Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">AI Task Assistant</h2>
          <button 
            onClick={() => setShowAiAssist(!showAiAssist)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
          >
            <span>{showAiAssist ? '🤖' : '✨'}</span>
            {showAiAssist ? 'Hide AI Assistant' : 'Get AI Help'}
          </button>
        </div>
        
        {showAiAssist && (
          <AiSuggest 
            onSuggestionAccepted={(suggestion) => {
              console.log('AI Suggestion accepted:', suggestion);
              openAiAssistedModal(suggestion);
              setShowAiAssist(false); // Hide AI assistant after accepting suggestion
            }}
          />
        )}
      </div>

      {/* Tasks Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Tasks</h2>
          <button 
            onClick={openCreateModal}
            disabled={operationLoading}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Add Task
          </button>
        </div>
      
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center text-gray-500 py-10 italic">
            No tasks found. Create your first task!
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="flex flex-col lg:flex-row lg:justify-between lg:items-start p-4 border border-gray-200 rounded-lg gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{task.title}</h3>
                  {task.username && (
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      {task.username}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-3 leading-relaxed">{task.description}</p>
                <div className="flex gap-3 text-sm text-gray-500">
                  <span>{task.totalMinutes} minutes</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2 lg:ml-4">
                {/* Status Selector */}
                <select
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value as Task['status'])}
                  disabled={operationLoading}
                  className="p-2 border border-gray-300 rounded-md bg-white cursor-pointer focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
                
                {/* Action Buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(task)}
                    disabled={operationLoading}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Edit task"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    disabled={operationLoading}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Delete task"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>

    {/* Task Form Modal */}
    <TaskFormModal
      isOpen={isModalOpen}
      onClose={closeModal}
      onSubmit={handleTaskSubmit}
      mode={modalMode}
      task={selectedTask}
      aiSuggestion={aiSuggestion}
    />
    </div>
  );
};

export default TaskList;
