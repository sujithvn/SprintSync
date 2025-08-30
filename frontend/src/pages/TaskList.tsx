import React, { useState, useEffect } from 'react';
import { Task } from '@/types';
import { taskApi } from '@/services/api';
import AiSuggest from '@/components/AiSuggest';

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAiAssist, setShowAiAssist] = useState(false);

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
              // TODO: Use this to pre-fill task creation form
              alert(`AI Suggestion accepted!\nDescription: ${suggestion.suggestedDescription}\nEstimated time: ${suggestion.estimatedMinutes} minutes`);
            }}
          />
        )}
      </div>

      {/* Tasks Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Tasks</h2>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors">
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
            <div key={task.id} className="flex flex-col md:flex-row md:justify-between md:items-start p-4 border border-gray-200 rounded-lg gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">{task.title}</h3>
                <p className="text-gray-600 mb-3 leading-relaxed">{task.description}</p>
                <div className="flex gap-3 text-sm text-gray-500">
                  <span>{task.totalMinutes} minutes</span>
                </div>
              </div>
              <div className="md:ml-4">
                <select
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value as Task['status'])}
                  className="p-2 border border-gray-300 rounded-md bg-white cursor-pointer focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </div>
  );
};

export default TaskList;
