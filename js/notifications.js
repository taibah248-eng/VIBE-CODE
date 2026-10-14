/**
 * TaskFlow Notification & Reminder Engine
 * Integrates real Web Notification API with fallbacks and in-app alerts
 */

class NotificationManager {
  constructor() {
    this.checkInterval = null;
    this.history = [];
    this.init();
  }

  init() {
    // Start background reminder watcher
    this.startWatcher();
  }

  getPermissionStatus() {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      this.showToast('Browser notifications are not supported on this browser.', 'info');
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        window.appState.setNotificationSettings({ enabled: true });
        this.showToast('Notifications enabled successfully! 🔔', 'success');
        this.sendSystemNotification('TaskFlow Notifications Active', {
          body: 'You will receive reminders for scheduled tasks and upcoming deadlines.',
          icon: 'assets/icon.jpg'
        });
      } else if (permission === 'denied') {
        window.appState.setNotificationSettings({ enabled: false });
        this.showToast('Notification permission denied. In-app alerts will be used.', 'info');
      }
      return permission;
    } catch (e) {
      console.warn('Notification permission error', e);
      return 'denied';
    }
  }

  sendSystemNotification(title, options = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return false;
    }

    try {
      const notif = new Notification(title, {
        icon: options.icon || 'assets/icon.jpg',
        badge: 'assets/icon.jpg',
        body: options.body || '',
        tag: options.tag || 'taskflow-reminder',
        renotify: true,
        ...options
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      return true;
    } catch (e) {
      console.warn('System notification trigger failed', e);
      return false;
    }
  }

  showToast(message, type = 'info', undoCallback = null) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    if (window.soundEngine) {
      if (type === 'success') window.soundEngine.playComplete();
      else if (type === 'danger') window.soundEngine.playDelete();
      else window.soundEngine.playAlert();
    }

    const toast = document.createElement('div');
    toast.className = `toast-card ${type}`;

    let undoBtnHtml = '';
    if (undoCallback) {
      undoBtnHtml = `<button class="toast-undo-btn" id="toast-undo-btn">Undo</button>`;
    }

    toast.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span>${message}</span>
      </div>
      ${undoBtnHtml}
    `;

    container.appendChild(toast);

    if (undoCallback) {
      const undoBtn = toast.querySelector('#toast-undo-btn');
      if (undoBtn) {
        undoBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          undoCallback();
          toast.remove();
        });
      }
    }

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4500);
  }

  testNotification() {
    const hasPermission = this.getPermissionStatus() === 'granted';
    if (hasPermission) {
      this.sendSystemNotification('TaskFlow Reminder Test', {
        body: 'Your notification system is working perfectly!',
        icon: 'assets/icon.jpg'
      });
      this.showToast('Test notification dispatched to system tray!', 'success');
    } else {
      this.showToast('Test Reminder: "Review Q4 Roadmap" is due in 15 minutes!', 'info');
    }
  }

  startWatcher() {
    if (this.checkInterval) clearInterval(this.checkInterval);

    // Check reminders every 20 seconds
    this.checkInterval = setInterval(() => {
      this.checkDueReminders();
    }, 20000);
  }

  checkDueReminders() {
    const tasks = window.appState.getTasks();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMin = currentHours * 60 + currentMinutes;

    tasks.forEach(task => {
      if (task.completed || !task.reminder || !task.reminder.enabled || task.reminder.notified) {
        return;
      }

      if (task.dueDate === todayStr && task.dueTime) {
        const [dueH, dueM] = task.dueTime.split(':').map(Number);
        const dueTotalMin = dueH * 60 + dueM;
        const diff = dueTotalMin - currentTotalMin;

        // Trigger if within offset or slightly past due (within 5 min window)
        const offset = task.reminder.offsetMinutes || 0;
        if (diff <= offset && diff >= -10) {
          // Mark notified
          task.reminder.notified = true;
          window.appState.save();

          const alertText = diff <= 0 ? `Task "${task.title}" is DUE NOW!` : `Reminder: "${task.title}" is due in ${diff} minutes!`;

          this.showToast(alertText, 'info');
          this.sendSystemNotification('Task Due Alert ⏰', {
            body: alertText,
            icon: 'assets/icon.jpg'
          });
        }
      }
    });
  }
}

window.notificationManager = new NotificationManager();
