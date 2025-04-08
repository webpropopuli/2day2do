import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  PlusCircle as CirclePlus, 
  Trash2, 
  Link as LinkIcon, 
  Mail, 
  Lock, 
  AlertCircle, 
  Clock, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Code,
  GripVertical,
  LayoutList,
  FileText
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Task {
  id: string;
  text: string;
  notes: string;
  priority: number;
  user_id: string;
  created_at: string;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const formatTaskAge = (createdAt: string) => {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const diffMinutes = Math.floor((now - created) / (1000 * 60));
  
  if (diffMinutes < 60) {
    if (diffMinutes < 1) return 'Just now';
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
};

function SortableTask({ task, index, selectedId, onSelect, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const age = formatTaskAge(task.created_at);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-gray-700 rounded-lg p-4 flex items-start gap-4 hover:bg-gray-600 transition-all ${
        selectedId === task.id ? 'ring-2 ring-purple-500' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-500 rounded"
      >
        <GripVertical size={20} className="text-gray-400" />
      </div>
      <div
        className="flex-1 cursor-pointer"
        onClick={() => onSelect(task)}
      >
        <div className="flex items-center gap-2">
          <span>{task.text}</span>
          {age && (
            <span className="text-xs text-purple-400 flex items-center gap-1">
              <Clock size={12} />
              {age}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => onRemove(task.id)}
        className="p-1 rounded hover:bg-gray-500 transition-colors"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [notes, setNotes] = useState('');
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'notes'>('split');
  const [sortType, setSortType] = useState<'priority' | 'age'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, sortType, sortOrder]);

  const handleSignIn = async () => {
    setLoading(true);
    setAuthError('');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setAuthError(error.message);
      }
    } catch (error) {
      setAuthError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setAuthError('');
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        setAuthError(error.message);
      }
    } catch (error) {
      setAuthError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order(sortType === 'priority' ? 'priority' : 'created_at', { ascending: sortOrder === 'asc' });
      
      if (error) throw error;
      
      setTasks(data ?? []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const addTask = async () => {
    if (!newTask.trim() || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          text: newTask,
          notes: '',
          priority: tasks.length,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setTasks([...tasks, data]);
      setNewTask('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const removeTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(tasks.filter(task => task.id !== id));
      if (selectedTask?.id === id) {
        setSelectedTask(null);
        setNotes('');
      }
    } catch (error) {
      console.error('Error removing task:', error);
    }
  };

  const updateNotes = async (newNotes: string) => {
    if (!selectedTask) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ notes: newNotes })
        .eq('id', selectedTask.id);

      if (error) throw error;

      setNotes(newNotes);
      setTasks(tasks.map(task => 
        task.id === selectedTask.id ? { ...task, notes: newNotes } : task
      ));
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = tasks.findIndex(task => task.id === active.id);
      const newIndex = tasks.findIndex(task => task.id === over.id);
      
      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      
      try {
        for (const [index, task] of newTasks.entries()) {
          const { error } = await supabase
            .from('tasks')
            .update({ priority: index })
            .eq('id', task.id);

          if (error) throw error;
        }

        setTasks(newTasks);
      } catch (error) {
        console.error('Error updating priorities:', error);
      }
    }
  };

  const toggleSort = () => {
    if (sortType === 'priority') {
      setSortType('age');
      setSortOrder('desc');
    } else {
      setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
    }
  };

  const getAdjacentTask = (direction: 'next' | 'prev') => {
    if (!selectedTask || tasks.length === 0) return null;
    const currentIndex = tasks.findIndex(task => task.id === selectedTask.id);
    if (currentIndex === -1) return null;

    const newIndex = direction === 'next' 
      ? (currentIndex + 1) % tasks.length 
      : (currentIndex - 1 + tasks.length) % tasks.length;
    
    return tasks[newIndex];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-xl shadow-xl w-full max-w-md">
          <h1 className="text-3xl font-bold text-purple-300 mb-8 text-center">
            2Day2Do
          </h1>
          
          {authError && (
            <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg flex items-center gap-3 text-red-200">
              <AlertCircle size={20} />
              <span>{authError}</span>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg pl-10 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your email"
                />
                <Mail className="absolute left-3 top-2.5 text-gray-400" size={20} />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg pl-10 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your password"
                />
                <Lock className="absolute left-3 top-2.5 text-gray-400" size={20} />
              </div>
            </div>
            
            <div className="pt-2 space-y-3">
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Sign In'}
              </button>
              
              <button
                onClick={handleSignUp}
                disabled={loading}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-purple-300">
            2Day2Do
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode(current => {
                switch (current) {
                  case 'split': return 'list';
                  case 'list': return 'notes';
                  case 'notes': return 'split';
                }
              })}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {viewMode === 'split' ? 'To List View' : viewMode === 'list' ? 'To Note View' : 'To Split View'}
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
        
        <div className={`grid grid-cols-1 ${
          viewMode === 'split' ? 'md:grid-cols-3' : 'md:grid-cols-1'
        } gap-6`}>
          {/* Task List */}
          {(viewMode === 'split' || viewMode === 'list') && (
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
              <div className="flex gap-4 mb-8">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  placeholder="Add a new task..."
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={addTask}
                  className="p-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors"
                >
                  <CirclePlus size={24} />
                </button>
              </div>

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-purple-300">
                  Tasks
                </h2>
                <button
                  onClick={toggleSort}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                >
                  {sortType === 'priority' ? (
                    <>
                      Sort by age
                      <Clock size={16} />
                    </>
                  ) : (
                    <>
                      {sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}
                      <ArrowUpDown size={16} />
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-4">
                {sortType === 'priority' ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={tasks.map(t => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {tasks.map((task, index) => (
                        <SortableTask
                          key={task.id}
                          task={task}
                          index={index}
                          selectedId={selectedTask?.id}
                          onSelect={(task) => {
                            setSelectedTask(task);
                            setNotes(task.notes);
                          }}
                          onRemove={removeTask}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                ) : (
                  tasks.map((task) => {
                    const age = formatTaskAge(task.created_at);
                    return (
                      <div
                        key={task.id}
                        className={`group bg-gray-700 rounded-lg p-4 flex items-start justify-between gap-4 hover:bg-gray-600 transition-all cursor-pointer ${
                          selectedTask?.id === task.id ? 'ring-2 ring-purple-500' : ''
                        }`}
                        onClick={() => {
                          setSelectedTask(task);
                          setNotes(task.notes);
                        }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span>{task.text}</span>
                            {age && (
                              <span className="text-xs text-purple-400 flex items-center gap-1">
                                <Clock size={12} />
                                {age}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTask(task.id);
                          }}
                          className="p-1 rounded hover:bg-gray-500 transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    );
                  })
                )}
                {tasks.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    No tasks yet. Add some tasks to get started!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {(viewMode === 'split' || viewMode === 'notes') && (
            <div className={`bg-gray-800 rounded-xl p-6 shadow-xl ${
              viewMode === 'split' ? 'md:col-span-2' : ''
            }`}>
              {selectedTask ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <h2 className="text-xl font-semibold text-purple-300">
                        {selectedTask.text}
                      </h2>
                      <span className="text-sm text-gray-400">
                        Task #{tasks.findIndex(t => t.id === selectedTask.id) + 1} of {tasks.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowRawMarkdown(!showRawMarkdown)}
                        className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                      >
                        {showRawMarkdown ? 'Render mode' : 'Raw mode'}
                      </button>
                      <button
                        onClick={() => {
                          const prevTask = getAdjacentTask('prev');
                          if (prevTask) {
                            setSelectedTask(prevTask);
                            setNotes(prevTask.notes);
                          }
                        }}
                        className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                        disabled={tasks.length <= 1}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() => {
                          const nextTask = getAdjacentTask('next');
                          if (nextTask) {
                            setSelectedTask(nextTask);
                            setNotes(nextTask.notes);
                          }
                        }}
                        className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                        disabled={tasks.length <= 1}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                  {showRawMarkdown ? (
                    <textarea
                      value={notes}
                      onChange={(e) => updateNotes(e.target.value)}
                      placeholder="Add your notes here... Supports Markdown!"
                      className="w-full h-[calc(100vh-20rem)] p-4 bg-gray-700 rounded-lg text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                  ) : (
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ node, ...props }) => (
                            <a {...props} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-1">
                              {props.children}
                              <LinkIcon size={14} />
                            </a>
                          ),
                        }}
                      >
                        {notes || '*No notes yet. Click the "Raw mode" button to start editing.*'}
                      </ReactMarkdown>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  {tasks.length === 0 
                    ? "No tasks yet. Add some tasks to get started!"
                    : "Select a task to view and edit notes"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;