/**
 * TaskFlow Application State & Persistence Store
 */

const STORAGE_KEY = 'TASKFLOW_STATE_V2';

// Date utility helpers relative to current system date
function getRelativeDateStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_SAMPLE_TASKS = [
  {
    id: 'task-sample-1',
    title: 'Review Q4 Product Architecture & Design Specs',
    description: 'Ensure all accessibility requirements and interaction state animations adhere to mobile HIG standards.',
    category: 'work',
    priority: 'high',
    dueDate: getRelativeDateStr(0),
    dueTime: '15:30',
    completed: false,
    completedAt: null,
    createdAt: new Date().toISOString(),
    subtasks: [
      { id: 'sub-1', text: 'Audit responsive touch targets (min 44px)', completed: true },
      { id: 'sub-2', text: 'Verify dark/light contrast ratios (WCAG AA)', completed: true },
      { id: 'sub-3', text: 'Sign off on calendar event transitions', completed: false }
    ],
    reminder: { enabled: true, offsetMinutes: 15, notified: false }
  },
  {
    id: 'task-sample-2',
    title: 'Complete Machine Learning Deep Dive Assignment',
    description: 'Finalize convolutional layer calculations and submit interactive Jupyter notebook report.',
    category: 'study',
    priority: 'medium',
    dueDate: getRelativeDateStr(0),
    dueTime: '18:00',
    completed: false,
    completedAt: null,
    createdAt: new Date().toISOString(),
    subtasks: [
      { id: 'sub-4', text: 'Plot loss and validation convergence graphs', completed: true },
      { id: 'sub-5', text: 'Write 300-word discussion summary', completed: false }
    ],
    reminder: { enabled: true, offsetMinutes: 30, notified: false }
  },
  {
    id: 'task-sample-3',
    title: 'Fresh Organic Produce & Weekly Groceries',
    description: 'Stop by Whole Foods for almond milk, fresh blueberries, and sourdough loaf.',
    category: 'shopping',
    priority: 'low',
    dueDate: getRelativeDateStr(0),
    dueTime: '19:30',
    completed: true,
    completedAt: new Date().toISOString(),
    subtasks: [
      { id: 'sub-6', text: 'Unsweetened almond milk', completed: true },
      { id: 'sub-7', text: 'Fresh berries & avocados', completed: true }
    ],
    reminder: { enabled: false, offsetMinutes: 0, notified: false }
  },
  {
    id: 'task-sample-4',
    title: 'Prepare Executive Presentation Slides',
    description: 'Draft 8 key narrative slides covering sprint velocity, retention metrics, and roadmap.',
    category: 'work',
    priority: 'high',
    dueDate: getRelativeDateStr(1), // Tomorrow
    dueTime: '11:00',
    completed: false,
    completedAt: null,
    createdAt: new Date().toISOString(),
    subtasks: [
      { id: 'sub-8', text: 'Export high-res Figma mockups', completed: false },
      { id: 'sub-9', text: 'Sync with product marketing lead', completed: false }
    ],
    reminder: { enabled: true, offsetMinutes: 60, notified: false }
  },
  {
    id: 'task-sample-5',
    title: '5km Sunset Trail Run & Core Mobility Routine',
    description: 'Lakeside trail route. Remember to drink 1L electrolyte water post-workout.',
    category: 'personal',
    priority: 'low',
    dueDate: getRelativeDateStr(2),
    dueTime: '18:30',
    completed: false,
    completedAt: null,
    createdAt: new Date().toISOString(),
    subtasks: [],
    reminder: { enabled: false, offsetMinutes: 0, notified: false }
  },
  {
    id: 'task-sample-6',
    title: 'Schedule Dental Check-up & Teeth Cleaning',
    description: 'Annual dental maintenance and hygiene appointment.',
    category: 'personal',
    priority: 'medium',
    dueDate: getRelativeDateStr(-1), // Yesterday (Completed)
    dueTime: '10:00',
    completed: true,
    completedAt: new Date(Date.now() - 86400000).toISOString(),
    subtasks: [],
    reminder: { enabled: false, offsetMinutes: 0, notified: true }
  }
];

class AppState {
  constructor() {
    this.subscribers = [];
    this.lastDeletedTask = null;
    this.state = this.loadInitialState();
  }

  loadInitialState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.tasks)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load state from localStorage', e);
    }

    // Default Fresh State
    return {
      tasks: JSON.parse(JSON.stringify(DEFAULT_SAMPLE_TASKS)),
      user: {
        name: 'Alex Morgan',
        email: 'alex.morgan@taskflow.app',
        role: 'Product Designer',
        avatar: 'assets/avatar.jpg',
        hasSeenOnboarding: false,
        isAuthenticated: true
      },
      settings: {
        theme: 'dark',
        viewMode: 'mobile',
        soundEnabled: true,
        notifications: {
          enabled: false,
          dueAlerts: true,
          morningDigest: true
        }
      }
    };
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save state', e);
    }
    this.notify();
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(fn => fn !== callback);
    };
  }

  notify() {
    for (const callback of this.subscribers) {
      try {
        callback(this.state);
      } catch (e) {
        console.error('Subscriber callback error', e);
      }
    }
  }

  // --- Task Operations ---

  getTasks() {
    return this.state.tasks;
  }

  getTaskById(id) {
    return this.state.tasks.find(t => t.id === id) || null;
  }

  addTask(taskData) {
    const newTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: taskData.title.trim(),
      description: (taskData.description || '').trim(),
      category: taskData.category || 'personal',
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate || getRelativeDateStr(0),
      dueTime: taskData.dueTime || '12:00',
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
      subtasks: taskData.subtasks || [],
      reminder: taskData.reminder || { enabled: false, offsetMinutes: 0, notified: false }
    };

    this.state.tasks.unshift(newTask);
    this.save();
    return newTask;
  }

  updateTask(id, updates) {
    const index = this.state.tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    this.state.tasks[index] = {
      ...this.state.tasks[index],
      ...updates
    };

    this.save();
    return this.state.tasks[index];
  }

  toggleComplete(id) {
    const task = this.getTaskById(id);
    if (!task) return null;

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;

    // If task is completed, also mark subtasks completed
    if (task.completed && task.subtasks && task.subtasks.length > 0) {
      task.subtasks.forEach(s => s.completed = true);
    }

    this.save();
    return task;
  }

  deleteTask(id) {
    const index = this.state.tasks.findIndex(t => t.id === id);
    if (index === -1) return false;

    this.lastDeletedTask = {
      task: this.state.tasks[index],
      index: index
    };

    this.state.tasks.splice(index, 1);
    this.save();
    return true;
  }

  undoDelete() {
    if (!this.lastDeletedTask) return null;
    const { task, index } = this.lastDeletedTask;
    const insertIdx = Math.min(index, this.state.tasks.length);
    this.state.tasks.splice(insertIdx, 0, task);
    this.lastDeletedTask = null;
    this.save();
    return task;
  }

  toggleSubtask(taskId, subtaskId) {
    const task = this.getTaskById(taskId);
    if (!task || !task.subtasks) return null;

    const sub = task.subtasks.find(s => s.id === subtaskId);
    if (!sub) return null;

    sub.completed = !sub.completed;

    // Check if all subtasks are now completed
    const allDone = task.subtasks.length > 0 && task.subtasks.every(s => s.completed);
    if (allDone && !task.completed) {
      task.completed = true;
      task.completedAt = new Date().toISOString();
    } else if (!allDone && task.completed) {
      task.completed = false;
      task.completedAt = null;
    }

    this.save();
    return task;
  }

  clearCompletedTasks() {
    const initialCount = this.state.tasks.length;
    this.state.tasks = this.state.tasks.filter(t => !t.completed);
    this.save();
    return initialCount - this.state.tasks.length;
  }

  resetToSampleData() {
    this.state.tasks = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_TASKS));
    this.save();
  }

  clearAllData() {
    this.state.tasks = [];
    this.save();
  }

  // --- User Profile & Preferences ---

  updateUser(profileData) {
    this.state.user = {
      ...this.state.user,
      ...profileData
    };
    this.save();
  }

  setTheme(theme) {
    this.state.settings.theme = theme;
    this.save();
  }

  setViewMode(mode) {
    this.state.settings.viewMode = mode;
    this.save();
  }

  setSoundEnabled(enabled) {
    this.state.settings.soundEnabled = enabled;
    if (window.soundEngine) {
      window.soundEngine.enabled = enabled;
    }
    this.save();
  }

  setNotificationSettings(settings) {
    this.state.settings.notifications = {
      ...this.state.settings.notifications,
      ...settings
    };
    this.save();
  }

  // --- Export & Import Backup ---

  exportBackupJSON() {
    return JSON.stringify(this.state, null, 2);
  }

  importBackupJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data && Array.isArray(data.tasks)) {
        this.state = data;
        this.save();
        return true;
      }
    } catch (e) {
      console.error('Import failed', e);
    }
    return false;
  }
}

window.appState = new AppState();
