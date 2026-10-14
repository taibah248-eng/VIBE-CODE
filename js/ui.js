/**
 * TaskFlow UI Components & Screen Renderers
 */

class AppUI {
  constructor() {
    this.selectedDate = new Date();
    this.currentCalendarMonth = new Date().getMonth();
    this.currentCalendarYear = new Date().getFullYear();
    this.selectedTaskId = null;
    this.searchFilterState = {
      query: '',
      status: 'all',
      priority: 'all',
      category: 'all',
      sortBy: 'dueDateAsc'
    };
    this.dashboardCategoryFilter = 'all';
    this.allTasksStatusFilter = 'all';
    this.allTasksSortBy = 'dueDate';
  }

  init() {
    this.updateClock();
    setInterval(() => this.updateClock(), 30000);

    // Initial render
    this.renderAll();

    // Subscribe to state changes
    window.appState.subscribe(() => {
      this.renderAll();
    });
  }

  updateClock() {
    const timeEl = document.getElementById('status-time-clock');
    if (timeEl) {
      const now = new Date();
      let hours = now.getHours();
      let minutes = String(now.getMinutes()).padStart(2, '0');
      timeEl.textContent = `${hours}:${minutes}`;
    }
  }

  getGreeting() {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  }

  getFormattedDate(date = new Date()) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  renderAll() {
    this.renderDashboard();
    this.renderAllTasksScreen();
    this.renderTodayTasksScreen();
    this.renderUpcomingTasksScreen();
    this.renderCalendar();
    this.renderSearchAndFilter();
    this.renderCompletedTasksScreen();
    this.renderProfileAndSettings();
    this.renderNotificationPreferences();

    // If details modal is open, re-render it
    if (this.selectedTaskId && window.appRouter.activeModal === 'modal-task-details') {
      this.renderTaskDetails(this.selectedTaskId);
    }
  }

  onScreenActivated(screenId) {
    if (screenId === 'screen-dashboard') this.renderDashboard();
    else if (screenId === 'screen-all-tasks') this.renderAllTasksScreen();
    else if (screenId === 'screen-today-tasks') this.renderTodayTasksScreen();
    else if (screenId === 'screen-upcoming-tasks') this.renderUpcomingTasksScreen();
    else if (screenId === 'screen-calendar') this.renderCalendar();
    else if (screenId === 'screen-search-filter') this.renderSearchAndFilter();
    else if (screenId === 'screen-completed-tasks') this.renderCompletedTasksScreen();
    else if (screenId === 'screen-profile-settings') this.renderProfileAndSettings();
    else if (screenId === 'screen-notifications') this.renderNotificationPreferences();
  }

  // =========================================================================
  // 1. DASHBOARD RENDERER
  // =========================================================================

  renderDashboard() {
    const state = window.appState.state;
    const tasks = state.tasks;
    const todayStr = new Date().toISOString().split('T')[0];

    // User greeting & date
    const greetingEl = document.getElementById('dash-greeting-text');
    const dateEl = document.getElementById('dash-current-date');
    if (greetingEl) greetingEl.textContent = `${this.getGreeting()}, ${state.user.name.split(' ')[0]} 👋`;
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

    // Avatar
    const dashAvatar = document.getElementById('dash-user-avatar');
    if (dashAvatar && state.user.avatar) dashAvatar.src = state.user.avatar;

    // Filter tasks for today
    const todayTasks = tasks.filter(t => t.dueDate === todayStr);
    const todayCompleted = todayTasks.filter(t => t.completed).length;
    const todayTotal = todayTasks.length;

    // Overdue tasks
    const overdueTasks = tasks.filter(t => !t.completed && t.dueDate < todayStr);

    // Completion percentage for today
    const percent = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : (tasks.length > 0 ? 100 : 0);

    // Update SVG Progress Ring
    const ringEl = document.getElementById('dash-progress-circle');
    const ringValEl = document.getElementById('dash-progress-percent');
    const ringTitleEl = document.getElementById('dash-progress-title');
    const ringSubEl = document.getElementById('dash-progress-sub');

    if (ringEl) {
      const circumference = 226; // 2 * PI * 36
      const offset = circumference - (percent / 100) * circumference;
      ringEl.style.strokeDashoffset = offset;
    }
    if (ringValEl) ringValEl.textContent = `${percent}%`;

    if (ringTitleEl) {
      if (percent === 100 && todayTotal > 0) ringTitleEl.textContent = "All Done Today! 🚀";
      else if (percent >= 50) ringTitleEl.textContent = "Great Momentum! ⚡";
      else if (todayTotal > 0) ringTitleEl.textContent = "Focus On Today ✨";
      else ringTitleEl.textContent = "Ready for New Tasks";
    }

    if (ringSubEl) {
      if (todayTotal > 0) ringSubEl.textContent = `${todayCompleted} of ${todayTotal} tasks completed`;
      else ringSubEl.textContent = "No tasks due today. Plan ahead!";
    }

    // Metrics Row
    const valToday = document.getElementById('metric-today-val');
    const valDone = document.getElementById('metric-done-val');
    const valOverdue = document.getElementById('metric-overdue-val');
    if (valToday) valToday.textContent = todayTotal;
    if (valDone) valDone.textContent = tasks.filter(t => t.completed).length;
    if (valOverdue) valOverdue.textContent = overdueTasks.length;

    // Render Today's Tasks List
    const todayListContainer = document.getElementById('dash-today-tasks-list');
    if (todayListContainer) {
      let filtered = todayTasks;
      if (this.dashboardCategoryFilter !== 'all') {
        filtered = filtered.filter(t => t.category === this.dashboardCategoryFilter);
      }

      if (filtered.length === 0) {
        todayListContainer.innerHTML = `
          <div class="empty-state" style="padding: 24px 10px;">
            <p class="empty-state-title" style="font-size: 1rem;">No tasks for this filter</p>
            <p class="empty-state-text" style="font-size: 0.8rem;">Tap the + button below to create a task.</p>
          </div>
        `;
      } else {
        todayListContainer.innerHTML = filtered.map(t => this.renderTaskCardHtml(t)).join('');
      }
    }

    // High Priority Section
    const highPriContainer = document.getElementById('dash-high-pri-list');
    if (highPriContainer) {
      const highPriTasks = tasks.filter(t => !t.completed && t.priority === 'high');
      if (highPriTasks.length === 0) {
        highPriContainer.innerHTML = `<p style="font-size:0.8rem; color:var(--text-tertiary); padding: 8px 0;">No high priority items pending. You are on track!</p>`;
      } else {
        highPriContainer.innerHTML = highPriTasks.slice(0, 3).map(t => this.renderTaskCardHtml(t)).join('');
      }
    }
  }

  // =========================================================================
  // 2. REUSABLE TASK CARD HTML GENERATOR
  // =========================================================================

  renderTaskCardHtml(task) {
    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = !task.completed && task.dueDate < todayStr;
    const isToday = task.dueDate === todayStr;

    let dateDisplay = task.dueDate;
    if (isToday) dateDisplay = `Today ${task.dueTime ? '• ' + task.dueTime : ''}`;
    else if (isOverdue) dateDisplay = `Overdue • ${task.dueDate}`;
    else {
      // Format as MMM DD
      const [y, m, d] = task.dueDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      dateDisplay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (task.dueTime) dateDisplay += ` • ${task.dueTime}`;
    }

    const subtasksTotal = task.subtasks ? task.subtasks.length : 0;
    const subtasksDone = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;

    return `
      <div class="task-card priority-${task.priority} ${task.completed ? 'completed' : ''}" data-task-id="${task.id}" onclick="window.appUI.handleTaskCardClick(event, '${task.id}')">
        <div class="task-checkbox-wrapper" onclick="window.appUI.handleToggleTask(event, '${task.id}')">
          <div class="task-custom-checkbox">
            <svg class="task-checkbox-icon" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>

        <div class="task-content">
          <div class="task-title">${this.escapeHtml(task.title)}</div>
          ${task.description ? `<div class="task-desc-preview">${this.escapeHtml(task.description)}</div>` : ''}

          <div class="task-meta-row">
            <span class="category-badge ${task.category}">${task.category.toUpperCase()}</span>
            <span class="priority-badge ${task.priority}">${task.priority}</span>
            <span class="task-date-pill ${isOverdue ? 'overdue' : ''}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              ${dateDisplay}
            </span>
            ${subtasksTotal > 0 ? `
              <span class="task-subtasks-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                ${subtasksDone}/${subtasksTotal}
              </span>
            ` : ''}
          </div>
        </div>

        <button class="task-action-menu-btn" title="View details" onclick="window.appUI.openTaskDetails('${task.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
        </button>
      </div>
    `;
  }

  // =========================================================================
  // 3. ALL TASKS SCREEN RENDERER
  // =========================================================================

  renderAllTasksScreen() {
    const container = document.getElementById('all-tasks-list-container');
    const countEl = document.getElementById('all-tasks-total-count');
    if (!container) return;

    let tasks = [...window.appState.getTasks()];

    // Apply status filter
    if (this.allTasksStatusFilter === 'pending') {
      tasks = tasks.filter(t => !t.completed);
    } else if (this.allTasksStatusFilter === 'completed') {
      tasks = tasks.filter(t => t.completed);
    }

    // Apply sorting
    if (this.allTasksSortBy === 'dueDate') {
      tasks.sort((a, b) => (a.dueDate + (a.dueTime || '')).localeCompare(b.dueDate + (b.dueTime || '')));
    } else if (this.allTasksSortBy === 'priority') {
      const priMap = { high: 1, medium: 2, low: 3 };
      tasks.sort((a, b) => priMap[a.priority] - priMap[b.priority]);
    } else if (this.allTasksSortBy === 'created') {
      tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (countEl) countEl.textContent = `${tasks.length} tasks`;

    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <div class="empty-state-title">No tasks found</div>
          <p class="empty-state-text">You have no tasks matching this criteria.</p>
          <button class="btn btn-primary btn-sm" onclick="window.appRouter.openModal('modal-add-task')">+ Add New Task</button>
        </div>
      `;
    } else {
      container.innerHTML = tasks.map(t => this.renderTaskCardHtml(t)).join('');
    }
  }

  // =========================================================================
  // 4. TODAY'S TASKS SCREEN RENDERER
  // =========================================================================

  renderTodayTasksScreen() {
    const container = document.getElementById('today-tasks-list-container');
    const headerDate = document.getElementById('today-screen-date-sub');
    if (!container) return;

    if (headerDate) {
      headerDate.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const tasks = window.appState.getTasks().filter(t => t.dueDate === todayStr || (!t.completed && t.dueDate < todayStr));

    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-title">All caught up for today! 🎉</div>
          <p class="empty-state-text">No pending or overdue tasks. Take a breath or schedule something new.</p>
          <button class="btn btn-primary btn-sm" onclick="window.appRouter.openModal('modal-add-task')">+ Add Task for Today</button>
        </div>
      `;
    } else {
      container.innerHTML = tasks.map(t => this.renderTaskCardHtml(t)).join('');
    }
  }

  // =========================================================================
  // 5. UPCOMING TASKS SCREEN RENDERER
  // =========================================================================

  renderUpcomingTasksScreen() {
    const container = document.getElementById('upcoming-tasks-list-container');
    if (!container) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingTasks = window.appState.getTasks().filter(t => t.dueDate > todayStr && !t.completed);

    if (upcomingTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-title">Nothing on the horizon 🌅</div>
          <p class="empty-state-text">No upcoming tasks scheduled for the future.</p>
          <button class="btn btn-primary btn-sm" onclick="window.appRouter.openModal('modal-add-task')">+ Plan Upcoming Task</button>
        </div>
      `;
    } else {
      upcomingTasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      container.innerHTML = upcomingTasks.map(t => this.renderTaskCardHtml(t)).join('');
    }
  }

  // =========================================================================
  // 6. CALENDAR SCREEN RENDERER
  // =========================================================================

  renderCalendar() {
    const monthYearTitle = document.getElementById('cal-month-year-title');
    const gridDays = document.getElementById('cal-days-grid');
    const selectedDateHeader = document.getElementById('cal-selected-date-header');
    const selectedListContainer = document.getElementById('cal-selected-tasks-list');

    if (!gridDays) return;

    const currentYear = this.currentCalendarYear;
    const currentMonth = this.currentCalendarMonth;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (monthYearTitle) {
      monthYearTitle.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }

    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

    const tasks = window.appState.getTasks();
    const todayStr = new Date().toISOString().split('T')[0];
    const selectedDateStr = this.selectedDate.toISOString().split('T')[0];

    let cellsHtml = '';

    // Previous month filler days
    for (let i = firstDayIndex; i > 0; i--) {
      const prevDay = prevMonthLastDay - i + 1;
      cellsHtml += `<div class="cal-day-cell other-month">${prevDay}</div>`;
    }

    // Current month days
    for (let day = 1; day <= lastDayOfMonth; day++) {
      const mStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${mStr}-${dStr}`;

      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDateStr;

      // Find tasks for this date
      const dateTasks = tasks.filter(t => t.dueDate === dateStr);
      let dotsHtml = '';
      if (dateTasks.length > 0) {
        dotsHtml = `
          <div class="cal-dots-container">
            ${dateTasks.slice(0, 3).map(t => `<div class="cal-task-dot" style="background-color: var(--priority-${t.priority});"></div>`).join('')}
          </div>
        `;
      }

      cellsHtml += `
        <div class="cal-day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" onclick="window.appUI.selectCalendarDate('${dateStr}')">
          <span>${day}</span>
          ${dotsHtml}
        </div>
      `;
    }

    gridDays.innerHTML = cellsHtml;

    // Render tasks for currently selected date
    if (selectedDateHeader) {
      const [sy, sm, sd] = selectedDateStr.split('-').map(Number);
      const selObj = new Date(sy, sm - 1, sd);
      selectedDateHeader.textContent = `Tasks for ${selObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
    }

    if (selectedListContainer) {
      const selectedTasks = tasks.filter(t => t.dueDate === selectedDateStr);
      if (selectedTasks.length === 0) {
        selectedListContainer.innerHTML = `
          <div style="text-align:center; padding: 20px; color:var(--text-tertiary); font-size: 0.85rem;">
            No tasks scheduled for this day.
            <div style="margin-top: 10px;">
              <button class="btn btn-secondary btn-sm" onclick="window.appUI.openAddTaskForDate('${selectedDateStr}')">+ Schedule Task</button>
            </div>
          </div>
        `;
      } else {
        selectedListContainer.innerHTML = selectedTasks.map(t => this.renderTaskCardHtml(t)).join('');
      }
    }
  }

  selectCalendarDate(dateStr) {
    if (window.soundEngine) window.soundEngine.playClick();
    const [y, m, d] = dateStr.split('-').map(Number);
    this.selectedDate = new Date(y, m - 1, d);
    this.renderCalendar();
  }

  prevCalendarMonth() {
    if (window.soundEngine) window.soundEngine.playClick();
    this.currentCalendarMonth--;
    if (this.currentCalendarMonth < 0) {
      this.currentCalendarMonth = 11;
      this.currentCalendarYear--;
    }
    this.renderCalendar();
  }

  nextCalendarMonth() {
    if (window.soundEngine) window.soundEngine.playClick();
    this.currentCalendarMonth++;
    if (this.currentCalendarMonth > 11) {
      this.currentCalendarMonth = 0;
      this.currentCalendarYear++;
    }
    this.renderCalendar();
  }

  resetCalendarToToday() {
    if (window.soundEngine) window.soundEngine.playClick();
    const now = new Date();
    this.selectedDate = now;
    this.currentCalendarMonth = now.getMonth();
    this.currentCalendarYear = now.getFullYear();
    this.renderCalendar();
  }

  openAddTaskForDate(dateStr) {
    const dueInput = document.getElementById('task-input-date');
    if (dueInput) dueInput.value = dateStr;
    window.appRouter.openModal('modal-add-task');
  }

  // =========================================================================
  // 7. SEARCH & FILTER SCREEN RENDERER
  // =========================================================================

  renderSearchAndFilter() {
    const resultsContainer = document.getElementById('search-results-list');
    const countBadge = document.getElementById('search-results-count');
    if (!resultsContainer) return;

    let tasks = window.appState.getTasks();
    const { query, status, priority, category, sortBy } = this.searchFilterState;

    // Filter by query text
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q)
      );
    }

    // Filter by status
    if (status === 'active') tasks = tasks.filter(t => !t.completed);
    else if (status === 'completed') tasks = tasks.filter(t => t.completed);

    // Filter by priority
    if (priority !== 'all') tasks = tasks.filter(t => t.priority === priority);

    // Filter by category
    if (category !== 'all') tasks = tasks.filter(t => t.category === category);

    // Sort
    if (sortBy === 'dueDateAsc') {
      tasks.sort((a, b) => (a.dueDate + (a.dueTime || '')).localeCompare(b.dueDate + (b.dueTime || '')));
    } else if (sortBy === 'dueDateDesc') {
      tasks.sort((a, b) => (b.dueDate + (b.dueTime || '')).localeCompare(a.dueDate + (a.dueTime || '')));
    } else if (sortBy === 'priorityHigh') {
      const priMap = { high: 1, medium: 2, low: 3 };
      tasks.sort((a, b) => priMap[a.priority] - priMap[b.priority]);
    } else if (sortBy === 'priorityLow') {
      const priMap = { high: 3, medium: 2, low: 1 };
      tasks.sort((a, b) => priMap[a.priority] - priMap[b.priority]);
    } else if (sortBy === 'createdDesc') {
      tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'titleAsc') {
      tasks.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (countBadge) countBadge.textContent = `${tasks.length} found`;

    if (tasks.length === 0) {
      resultsContainer.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <div class="empty-state-title">No matching tasks</div>
          <p class="empty-state-text">Try adjusting your keywords, category, or priority filters.</p>
        </div>
      `;
    } else {
      resultsContainer.innerHTML = tasks.map(t => this.renderTaskCardHtml(t)).join('');
    }
  }

  // =========================================================================
  // 8. COMPLETED TASKS SCREEN RENDERER
  // =========================================================================

  renderCompletedTasksScreen() {
    const container = document.getElementById('completed-tasks-list');
    const countEl = document.getElementById('completed-count-badge');
    if (!container) return;

    const completedTasks = window.appState.getTasks().filter(t => t.completed);
    if (countEl) countEl.textContent = `${completedTasks.length} completed`;

    if (completedTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-title">No completed tasks yet</div>
          <p class="empty-state-text">Finish tasks by tapping the checkmark to see them celebrated here.</p>
        </div>
      `;
    } else {
      container.innerHTML = completedTasks.map(t => `
        <div class="task-card completed" data-task-id="${t.id}">
          <div class="task-checkbox-wrapper" onclick="window.appUI.handleToggleTask(event, '${t.id}')">
            <div class="task-custom-checkbox">
              <svg class="task-checkbox-icon" viewBox="0 0 24 24" style="opacity:1; transform:scale(1);"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
          </div>
          <div class="task-content">
            <div class="task-title" style="text-decoration:line-through; color:var(--text-tertiary);">${this.escapeHtml(t.title)}</div>
            <div class="task-meta-row">
              <span class="category-badge ${t.category}">${t.category.toUpperCase()}</span>
              <span style="font-size:0.75rem; color:var(--text-tertiary);">Finished ${t.completedAt ? new Date(t.completedAt).toLocaleDateString() : 'recently'}</span>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="window.appUI.handleToggleTask(event, '${t.id}')" title="Restore task">Restore</button>
        </div>
      `).join('');
    }
  }

  // =========================================================================
  // 9. PROFILE & SETTINGS RENDERER
  // =========================================================================

  renderProfileAndSettings() {
    const state = window.appState.state;
    const nameEl = document.getElementById('profile-name-display');
    const emailEl = document.getElementById('profile-email-display');
    const roleEl = document.getElementById('profile-role-display');
    const avatarEl = document.getElementById('profile-avatar-img');

    if (nameEl) nameEl.textContent = state.user.name;
    if (emailEl) emailEl.textContent = state.user.email;
    if (roleEl) roleEl.textContent = state.user.role;
    if (avatarEl && state.user.avatar) avatarEl.src = state.user.avatar;

    // Productivity Statistics
    const tasks = state.tasks;
    const totalCreated = tasks.length;
    const totalCompleted = tasks.filter(t => t.completed).length;
    const completionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

    const statTotal = document.getElementById('stat-total-created');
    const statDone = document.getElementById('stat-total-completed');
    const statRate = document.getElementById('stat-completion-rate');

    if (statTotal) statTotal.textContent = totalCreated;
    if (statDone) statDone.textContent = totalCompleted;
    if (statRate) statRate.textContent = `${completionRate}%`;

    // Setting toggles sync
    const soundToggle = document.getElementById('setting-sound-toggle');
    const themeSelect = document.getElementById('setting-theme-select');
    if (soundToggle) soundToggle.checked = state.settings.soundEnabled;
    if (themeSelect) themeSelect.value = state.settings.theme;
  }

  // =========================================================================
  // 10. NOTIFICATION PREFERENCES RENDERER
  // =========================================================================

  renderNotificationPreferences() {
    const permStatusEl = document.getElementById('notif-perm-status-badge');
    const reqBtn = document.getElementById('notif-req-perm-btn');
    if (!permStatusEl) return;

    const status = window.notificationManager.getPermissionStatus();
    if (status === 'granted') {
      permStatusEl.textContent = 'Active (Granted)';
      permStatusEl.style.color = 'var(--success)';
      if (reqBtn) reqBtn.style.display = 'none';
    } else if (status === 'denied') {
      permStatusEl.textContent = 'Blocked (Denied)';
      permStatusEl.style.color = 'var(--danger)';
      if (reqBtn) reqBtn.style.display = 'none';
    } else {
      permStatusEl.textContent = 'Not Configured';
      permStatusEl.style.color = 'var(--warning)';
      if (reqBtn) reqBtn.style.display = 'inline-flex';
    }
  }

  // =========================================================================
  // 11. TASK DETAILS SHEET RENDERER
  // =========================================================================

  openTaskDetails(taskId) {
    this.selectedTaskId = taskId;
    this.renderTaskDetails(taskId);
    window.appRouter.openModal('modal-task-details');
  }

  renderTaskDetails(taskId) {
    const task = window.appState.getTaskById(taskId);
    if (!task) return;

    const modal = document.getElementById('modal-task-details');
    if (!modal) return;

    const subtasksTotal = task.subtasks ? task.subtasks.length : 0;
    const subtasksDone = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
    const subtaskPercent = subtasksTotal > 0 ? (subtasksDone / subtasksTotal) * 100 : 0;

    modal.querySelector('#detail-task-title').textContent = task.title;
    modal.querySelector('#detail-task-desc').textContent = task.description || 'No detailed notes provided.';

    const catBadge = modal.querySelector('#detail-task-category');
    catBadge.className = `category-badge ${task.category}`;
    catBadge.textContent = task.category.toUpperCase();

    const priBadge = modal.querySelector('#detail-task-priority');
    priBadge.className = `priority-badge ${task.priority}`;
    priBadge.textContent = task.priority.toUpperCase();

    const statusBadge = modal.querySelector('#detail-task-status');
    statusBadge.className = `priority-badge ${task.completed ? 'low' : 'high'}`;
    statusBadge.textContent = task.completed ? 'COMPLETED' : 'PENDING';

    modal.querySelector('#detail-task-due').textContent = `${task.dueDate} ${task.dueTime ? 'at ' + task.dueTime : ''}`;
    modal.querySelector('#detail-task-created').textContent = new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Subtasks
    const subtaskListContainer = modal.querySelector('#detail-subtasks-list');
    const subtaskProgFill = modal.querySelector('#detail-subtask-progress-fill');
    const subtaskProgText = modal.querySelector('#detail-subtask-progress-text');

    if (subtaskProgFill) subtaskProgFill.style.width = `${subtaskPercent}%`;
    if (subtaskProgText) subtaskProgText.textContent = `${subtasksDone}/${subtasksTotal} Done`;

    if (subtaskListContainer) {
      if (subtasksTotal === 0) {
        subtaskListContainer.innerHTML = `<p style="font-size:0.8rem; color:var(--text-tertiary);">No checklist items added.</p>`;
      } else {
        subtaskListContainer.innerHTML = task.subtasks.map(s => `
          <div class="detail-subtask-item ${s.completed ? 'checked' : ''}" onclick="window.appUI.handleToggleSubtask('${task.id}', '${s.id}')">
            <div class="task-custom-checkbox" style="width:18px; height:18px; border-radius:5px; ${s.completed ? 'background:var(--success); border-color:var(--success);' : ''}">
              <svg class="task-checkbox-icon" viewBox="0 0 24 24" style="${s.completed ? 'opacity:1; transform:scale(1);' : ''}"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <span class="detail-subtask-label" style="font-size:0.85rem; font-weight:500;">${this.escapeHtml(s.text)}</span>
          </div>
        `).join('');
      }
    }
  }

  // =========================================================================
  // 12. TASK ACTIONS HANDLERS
  // =========================================================================

  handleTaskCardClick(event, taskId) {
    // If clicked on checkbox or menu button, ignore card opening
    if (event.target.closest('.task-checkbox-wrapper') || event.target.closest('.task-action-menu-btn')) {
      return;
    }
    this.openTaskDetails(taskId);
  }

  handleToggleTask(event, taskId) {
    if (event) event.stopPropagation();
    const task = window.appState.toggleComplete(taskId);
    if (!task) return;

    if (task.completed) {
      window.notificationManager.showToast(`Completed: "${task.title}" 🎉`, 'success', () => {
        window.appState.toggleComplete(taskId);
      });
    } else {
      window.notificationManager.showToast(`Restored task to active`, 'info');
    }
  }

  handleToggleSubtask(taskId, subtaskId) {
    window.appState.toggleSubtask(taskId, subtaskId);
    if (window.soundEngine) window.soundEngine.playClick();
  }

  openEditTaskModal(taskId) {
    const task = window.appState.getTaskById(taskId || this.selectedTaskId);
    if (!task) return;

    const modal = document.getElementById('modal-edit-task');
    if (!modal) return;

    modal.querySelector('#edit-task-id').value = task.id;
    modal.querySelector('#edit-task-title').value = task.title;
    modal.querySelector('#edit-task-desc').value = task.description || '';
    modal.querySelector('#edit-task-category').value = task.category;
    modal.querySelector('#edit-task-date').value = task.dueDate;
    modal.querySelector('#edit-task-time').value = task.dueTime || '12:00';

    // Priority buttons
    const priButtons = modal.querySelectorAll('.priority-toggle-btn');
    priButtons.forEach(btn => {
      btn.className = 'priority-toggle-btn';
      if (btn.dataset.priority === task.priority) {
        btn.classList.add(`selected-${task.priority}`);
      }
    });

    // Populate subtasks for editing
    this.renderEditSubtasksList(task.subtasks || []);

    window.appRouter.closeModal('modal-task-details');
    window.appRouter.openModal('modal-edit-task');
  }

  renderEditSubtasksList(subtasks) {
    const container = document.getElementById('edit-subtasks-builder-list');
    if (!container) return;

    container.innerHTML = subtasks.map((s, idx) => `
      <div class="subtask-item-row" data-subtask-id="${s.id}">
        <span>${this.escapeHtml(s.text)}</span>
        <button type="button" class="del-subtask-btn" onclick="window.appUI.removeEditSubtask('${s.id}')">✕</button>
      </div>
    `).join('');
  }

  removeEditSubtask(subId) {
    const row = document.querySelector(`.subtask-item-row[data-subtask-id="${subId}"]`);
    if (row) row.remove();
  }

  confirmDeleteTask(taskId) {
    const id = taskId || this.selectedTaskId;
    const task = window.appState.getTaskById(id);
    if (!task) return;

    const modal = document.getElementById('modal-confirm-delete');
    if (modal) {
      modal.querySelector('#confirm-delete-title').textContent = `Delete "${task.title}"?`;
      modal.querySelector('#confirm-delete-btn').onclick = () => {
        window.appState.deleteTask(id);
        window.appRouter.closeModal('modal-confirm-delete');
        window.appRouter.closeModal('modal-task-details');
        window.appRouter.closeModal('modal-edit-task');
        window.notificationManager.showToast('Task deleted', 'danger', () => {
          window.appState.undoDelete();
          window.notificationManager.showToast('Task restored! ↩️', 'success');
        });
      };
      window.appRouter.openModal('modal-confirm-delete');
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

window.appUI = new AppUI();
