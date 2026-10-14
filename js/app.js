/**
 * TaskFlow Main Application Entry & Event Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize State, UI, Router
  window.appState.loadInitialState();

  // Apply saved theme immediately
  const savedTheme = window.appState.state.settings.theme || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Apply saved view mode
  const savedView = window.appState.state.settings.viewMode || 'mobile';
  const viewportWrapper = document.getElementById('app-viewport-wrapper');
  if (savedView === 'fullscreen') {
    viewportWrapper.classList.add('fullscreen-mode');
  }

  // Initialize UI and Router
  window.appUI.init();
  window.appRouter.init();

  // 2. Setup Event Listeners
  setupDesktopControls();
  setupOnboardingEvents();
  setupAuthEvents();
  setupTaskFormEvents();
  setupEditTaskEvents();
  setupSearchFilterEvents();
  setupProfileSettingsEvents();
  setupNotificationEvents();
  setupNavigationEvents();
});

// =========================================================================
// 1. DESKTOP FRAME CONTROLS & THEME TOGGLE
// =========================================================================

function setupDesktopControls() {
  const toggleFrameBtn = document.getElementById('toggle-frame-btn');
  const toggleThemeBtn = document.getElementById('toggle-theme-btn');
  const viewportWrapper = document.getElementById('app-viewport-wrapper');

  if (toggleFrameBtn) {
    toggleFrameBtn.addEventListener('click', () => {
      viewportWrapper.classList.toggle('fullscreen-mode');
      const isFullscreen = viewportWrapper.classList.contains('fullscreen-mode');
      toggleFrameBtn.textContent = isFullscreen ? '📱 Phone View' : '🖥️ Fullscreen';
      window.appState.setViewMode(isFullscreen ? 'fullscreen' : 'mobile');
    });
  }

  if (toggleThemeBtn) {
    toggleThemeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      toggleThemeBtn.textContent = next === 'dark' ? '☀️ Light' : '🌙 Dark';
      window.appState.setTheme(next);
      window.notificationManager.showToast(`Switched to ${next} mode`, 'info');
    });
  }
}

// =========================================================================
// 2. ONBOARDING CAROUSEL
// =========================================================================

function setupOnboardingEvents() {
  let currentSlide = 0;
  const slides = document.querySelectorAll('.onboarding-slide');
  const dots = document.querySelectorAll('.onboarding-dot');
  const nextBtn = document.getElementById('onboarding-next-btn');
  const skipBtn = document.getElementById('onboarding-skip-btn');

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });

    if (index === slides.length - 1) {
      nextBtn.textContent = 'Get Started 🚀';
    } else {
      nextBtn.textContent = 'Next';
    }
    currentSlide = index;
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.slide, 10);
      showSlide(idx);
    });
  });

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentSlide < slides.length - 1) {
        showSlide(currentSlide + 1);
      } else {
        // Complete onboarding
        finishOnboarding();
      }
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      finishOnboarding();
    });
  }

  function finishOnboarding() {
    window.appState.updateUser({ hasSeenOnboarding: true });
    window.appRouter.navigateTo('screen-signup');
  }
}

// =========================================================================
// 3. AUTH (SIGNUP & LOGIN)
// =========================================================================

function setupAuthEvents() {
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');
  const guestSignupBtn = document.getElementById('signup-guest-btn');
  const guestLoginBtn = document.getElementById('login-guest-btn');

  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const role = document.getElementById('signup-role').value;

      if (!name) {
        window.notificationManager.showToast('Please enter your name', 'danger');
        return;
      }

      window.appState.updateUser({
        name: name,
        email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@taskflow.app`,
        role: role,
        hasSeenOnboarding: true
      });

      window.notificationManager.showToast(`Welcome to TaskFlow, ${name}! 🎉`, 'success');
      window.appRouter.navigateTo('screen-dashboard');
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      if (email) {
        window.appState.updateUser({ email });
      }
      window.notificationManager.showToast('Welcome back! ✨', 'success');
      window.appRouter.navigateTo('screen-dashboard');
    });
  }

  const bypassToDash = () => {
    window.appState.updateUser({ hasSeenOnboarding: true });
    window.appRouter.navigateTo('screen-dashboard');
    window.notificationManager.showToast('Entering as Guest Explorer ✨', 'info');
  };

  if (guestSignupBtn) guestSignupBtn.addEventListener('click', bypassToDash);
  if (guestLoginBtn) guestLoginBtn.addEventListener('click', bypassToDash);
}

// =========================================================================
// 4. TASK CREATION FORM
// =========================================================================

function setupTaskFormEvents() {
  const form = document.getElementById('add-task-form');
  const addSubtaskBtn = document.getElementById('add-subtask-input-btn');
  const subtaskInput = document.getElementById('new-subtask-text');
  const subtasksList = document.getElementById('new-subtasks-builder-list');

  // Priority toggle buttons
  const priorityBtns = document.querySelectorAll('#add-priority-group .priority-toggle-btn');
  let selectedPriority = 'medium';

  priorityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      priorityBtns.forEach(b => b.className = 'priority-toggle-btn');
      selectedPriority = btn.dataset.priority;
      btn.classList.add(`selected-${selectedPriority}`);
      if (window.soundEngine) window.soundEngine.playClick();
    });
  });

  // Adding subtasks to task creation list
  function appendSubtaskItem() {
    const text = subtaskInput.value.trim();
    if (!text) return;

    const subId = 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 3);
    const item = document.createElement('div');
    item.className = 'subtask-item-row';
    item.dataset.subId = subId;
    item.innerHTML = `
      <span>${window.appUI.escapeHtml(text)}</span>
      <button type="button" class="del-subtask-btn" onclick="this.closest('.subtask-item-row').remove()">✕</button>
    `;
    subtasksList.appendChild(item);
    subtaskInput.value = '';
    subtaskInput.focus();
    if (window.soundEngine) window.soundEngine.playClick();
  }

  if (addSubtaskBtn) addSubtaskBtn.addEventListener('click', appendSubtaskItem);
  if (subtaskInput) {
    subtaskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        appendSubtaskItem();
      }
    });
  }

  // Form submission
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('task-input-title').value.trim();
      const desc = document.getElementById('task-input-desc').value.trim();
      const category = document.getElementById('task-input-category').value;
      const dueDate = document.getElementById('task-input-date').value;
      const dueTime = document.getElementById('task-input-time').value;
      const reminderEnabled = document.getElementById('task-input-reminder').checked;

      if (!title) {
        window.notificationManager.showToast('Please enter a task title', 'danger');
        document.getElementById('task-input-title').focus();
        return;
      }

      // Collect subtasks
      const subtaskNodes = subtasksList.querySelectorAll('.subtask-item-row');
      const subtasks = Array.from(subtaskNodes).map(node => ({
        id: node.dataset.subId,
        text: node.querySelector('span').textContent,
        completed: false
      }));

      // Create Task
      const newTask = window.appState.addTask({
        title,
        description: desc,
        category,
        priority: selectedPriority,
        dueDate: dueDate || new Date().toISOString().split('T')[0],
        dueTime: dueTime || '12:00',
        subtasks,
        reminder: {
          enabled: reminderEnabled,
          offsetMinutes: 15,
          notified: false
        }
      });

      // Reset form
      form.reset();
      subtasksList.innerHTML = '';
      priorityBtns.forEach(b => b.className = 'priority-toggle-btn');
      document.querySelector('#add-priority-group .priority-toggle-btn[data-priority="medium"]').classList.add('selected-medium');
      selectedPriority = 'medium';

      window.appRouter.closeModal('modal-add-task');
      window.notificationManager.showToast(`Task created: "${newTask.title}" 🎯`, 'success');
    });
  }
}

// =========================================================================
// 5. EDIT TASK FORM
// =========================================================================

function setupEditTaskEvents() {
  const form = document.getElementById('edit-task-form');
  const addSubtaskBtn = document.getElementById('edit-subtask-input-btn');
  const subtaskInput = document.getElementById('edit-new-subtask-text');
  const subtasksList = document.getElementById('edit-subtasks-builder-list');

  // Priority buttons for edit modal
  const priBtns = document.querySelectorAll('#edit-priority-group .priority-toggle-btn');
  priBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      priBtns.forEach(b => b.className = 'priority-toggle-btn');
      btn.classList.add(`selected-${btn.dataset.priority}`);
      if (window.soundEngine) window.soundEngine.playClick();
    });
  });

  function appendEditSubtaskItem() {
    const text = subtaskInput.value.trim();
    if (!text) return;

    const subId = 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 3);
    const item = document.createElement('div');
    item.className = 'subtask-item-row';
    item.dataset.subtaskId = subId;
    item.innerHTML = `
      <span>${window.appUI.escapeHtml(text)}</span>
      <button type="button" class="del-subtask-btn" onclick="this.closest('.subtask-item-row').remove()">✕</button>
    `;
    subtasksList.appendChild(item);
    subtaskInput.value = '';
    subtaskInput.focus();
  }

  if (addSubtaskBtn) addSubtaskBtn.addEventListener('click', appendEditSubtaskItem);
  if (subtaskInput) {
    subtaskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        appendEditSubtaskItem();
      }
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-task-id').value;
      const title = document.getElementById('edit-task-title').value.trim();
      const desc = document.getElementById('edit-task-desc').value.trim();
      const category = document.getElementById('edit-task-category').value;
      const dueDate = document.getElementById('edit-task-date').value;
      const dueTime = document.getElementById('edit-task-time').value;

      if (!title) {
        window.notificationManager.showToast('Task title cannot be empty', 'danger');
        return;
      }

      const activePriBtn = document.querySelector('#edit-priority-group .priority-toggle-btn[class*="selected-"]');
      const priority = activePriBtn ? activePriBtn.dataset.priority : 'medium';

      // Collect existing subtasks
      const existingTask = window.appState.getTaskById(id);
      const subtaskNodes = subtasksList.querySelectorAll('.subtask-item-row');
      const subtasks = Array.from(subtaskNodes).map(node => {
        const subId = node.dataset.subtaskId;
        const oldSub = existingTask && existingTask.subtasks ? existingTask.subtasks.find(s => s.id === subId) : null;
        return {
          id: subId || ('sub-' + Date.now()),
          text: node.querySelector('span').textContent,
          completed: oldSub ? oldSub.completed : false
        };
      });

      window.appState.updateTask(id, {
        title,
        description: desc,
        category,
        priority,
        dueDate,
        dueTime,
        subtasks
      });

      window.appRouter.closeModal('modal-edit-task');
      window.notificationManager.showToast('Task updated successfully ✨', 'success');
    });
  }
}

// =========================================================================
// 6. SEARCH & FILTER CONTROLLER
// =========================================================================

function setupSearchFilterEvents() {
  const searchInput = document.getElementById('search-query-input');
  const clearBtn = document.getElementById('search-clear-query-btn');
  const sortSelect = document.getElementById('search-sort-select');

  // Debounce search query
  let debounceTimeout = null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimeout);
      const val = e.target.value;
      if (clearBtn) clearBtn.classList.toggle('visible', val.length > 0);

      debounceTimeout = setTimeout(() => {
        window.appUI.searchFilterState.query = val;
        window.appUI.renderSearchAndFilter();
      }, 180);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.classList.remove('visible');
      window.appUI.searchFilterState.query = '';
      window.appUI.renderSearchAndFilter();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      window.appUI.searchFilterState.sortBy = e.target.value;
      window.appUI.renderSearchAndFilter();
    });
  }

  // Filter chips in Search screen
  const filterPills = document.querySelectorAll('.filter-chip-btn');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const type = pill.dataset.filterType; // 'status' | 'priority' | 'category'
      const val = pill.dataset.filterVal;

      // Unselect siblings
      const siblings = document.querySelectorAll(`.filter-chip-btn[data-filter-type="${type}"]`);
      siblings.forEach(s => s.classList.remove('active'));
      pill.classList.add('active');

      window.appUI.searchFilterState[type] = val;
      window.appUI.renderSearchAndFilter();
    });
  });

  // Dashboard quick category filters
  const dashCatChips = document.querySelectorAll('#dash-category-scroll .category-chip');
  dashCatChips.forEach(chip => {
    chip.addEventListener('click', () => {
      dashCatChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      window.appUI.dashboardCategoryFilter = chip.dataset.category;
      window.appUI.renderDashboard();
    });
  });
}

// =========================================================================
// 7. PROFILE & SETTINGS
// =========================================================================

function setupProfileSettingsEvents() {
  const soundToggle = document.getElementById('setting-sound-toggle');
  const themeSelect = document.getElementById('setting-theme-select');
  const resetSampleBtn = document.getElementById('setting-reset-sample-btn');
  const exportBtn = document.getElementById('setting-export-btn');
  const importInput = document.getElementById('setting-import-file-input');
  const clearAllBtn = document.getElementById('setting-clear-all-btn');

  if (soundToggle) {
    soundToggle.addEventListener('change', (e) => {
      window.appState.setSoundEnabled(e.target.checked);
      window.notificationManager.showToast(`Sound effects ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
    });
  }

  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      document.documentElement.setAttribute('data-theme', theme);
      window.appState.setTheme(theme);
      window.notificationManager.showToast(`Theme updated to ${theme}`, 'info');
    });
  }

  if (resetSampleBtn) {
    resetSampleBtn.addEventListener('click', () => {
      if (confirm('Reset tasks to initial sample showcase data?')) {
        window.appState.resetToSampleData();
        window.notificationManager.showToast('Sample tasks restored! 📋', 'success');
      }
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const json = window.appState.exportBackupJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taskflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      window.notificationManager.showToast('Data exported successfully! 💾', 'success');
    });
  }

  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const success = window.appState.importBackupJSON(event.target.result);
        if (success) {
          window.notificationManager.showToast('Backup restored successfully! 🔄', 'success');
        } else {
          window.notificationManager.showToast('Invalid backup file format', 'danger');
        }
      };
      reader.readAsText(file);
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete ALL tasks permanently?')) {
        window.appState.clearAllData();
        window.notificationManager.showToast('All tasks cleared', 'danger');
      }
    });
  }
}

// =========================================================================
// 8. NOTIFICATION PREFERENCES
// =========================================================================

function setupNotificationEvents() {
  const reqBtn = document.getElementById('notif-req-perm-btn');
  const testBtn = document.getElementById('notif-test-btn');

  if (reqBtn) {
    reqBtn.addEventListener('click', async () => {
      await window.notificationManager.requestPermission();
      window.appUI.renderNotificationPreferences();
    });
  }

  if (testBtn) {
    testBtn.addEventListener('click', () => {
      window.notificationManager.testNotification();
    });
  }
}

// =========================================================================
// 9. NAVIGATION SHORTCUTS & BOTTOM BAR
// =========================================================================

function setupNavigationEvents() {
  // Bottom nav buttons
  const navHome = document.getElementById('nav-home');
  const navTasks = document.getElementById('nav-tasks');
  const navFab = document.getElementById('nav-fab-add');
  const navCal = document.getElementById('nav-calendar');
  const navProf = document.getElementById('nav-profile');

  if (navHome) navHome.addEventListener('click', () => window.appRouter.navigateTo('screen-dashboard'));
  if (navTasks) navTasks.addEventListener('click', () => window.appRouter.navigateTo('screen-all-tasks'));
  if (navFab) {
    navFab.addEventListener('click', () => {
      // Set today's date in form default
      const dateInp = document.getElementById('task-input-date');
      if (dateInp) dateInp.value = new Date().toISOString().split('T')[0];
      window.appRouter.openModal('modal-add-task');
    });
  }
  if (navCal) navCal.addEventListener('click', () => window.appRouter.navigateTo('screen-calendar'));
  if (navProf) navProf.addEventListener('click', () => window.appRouter.navigateTo('screen-profile-settings'));
}
