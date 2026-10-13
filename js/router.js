/**
 * TaskFlow Router & Screen Navigation Controller
 */

class AppRouter {
  constructor() {
    this.currentScreen = 'splash';
    this.history = [];
    this.activeModal = null;
    this.authScreens = ['screen-splash', 'screen-onboarding', 'screen-signup', 'screen-login'];
  }

  init() {
    // Check if user has already seen onboarding
    const state = window.appState.state;

    // Start with splash screen
    this.showScreen('screen-splash', false);

    // After 1.8s splash screen duration, route to onboarding or dashboard
    setTimeout(() => {
      if (this.currentScreen === 'screen-splash') {
        if (!state.user.hasSeenOnboarding) {
          this.navigateTo('screen-onboarding');
        } else {
          this.navigateTo('screen-dashboard');
        }
      }
    }, 1800);

    // Setup global ESC key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.closeModal(this.activeModal);
      }
    });
  }

  showScreen(screenId, pushToHistory = true) {
    const screens = document.querySelectorAll('.app-screen');
    const targetScreen = document.getElementById(screenId);

    if (!targetScreen) {
      console.warn(`Screen ${screenId} not found.`);
      return;
    }

    if (pushToHistory && this.currentScreen && this.currentScreen !== screenId) {
      this.history.push(this.currentScreen);
    }

    screens.forEach(s => {
      s.classList.remove('active');
    });

    targetScreen.classList.add('active');
    this.currentScreen = screenId;

    // Toggle bottom navigation visibility
    const bottomNav = document.getElementById('bottom-nav-bar');
    const screenContainer = document.getElementById('screen-container');

    if (this.authScreens.includes(screenId)) {
      if (bottomNav) bottomNav.classList.add('hidden');
      if (screenContainer) screenContainer.classList.add('auth-mode');
    } else {
      if (bottomNav) bottomNav.classList.remove('hidden');
      if (screenContainer) screenContainer.classList.remove('auth-mode');
      this.syncBottomNav(screenId);
    }

    // Scroll active screen to top
    targetScreen.scrollTop = 0;

    // Notify UI to refresh screen content if needed
    if (window.appUI) {
      window.appUI.onScreenActivated(screenId);
    }
  }

  navigateTo(screenId, pushToHistory = true) {
    if (window.soundEngine) {
      window.soundEngine.playClick();
    }
    this.showScreen(screenId, pushToHistory);
  }

  goBack() {
    if (window.soundEngine) {
      window.soundEngine.playClick();
    }
    if (this.history.length > 0) {
      const prevScreen = this.history.pop();
      this.showScreen(prevScreen, false);
    } else {
      this.showScreen('screen-dashboard', false);
    }
  }

  syncBottomNav(screenId) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    let targetNavId = null;
    if (screenId === 'screen-dashboard') targetNavId = 'nav-home';
    else if (['screen-all-tasks', 'screen-today-tasks', 'screen-upcoming-tasks'].includes(screenId)) targetNavId = 'nav-tasks';
    else if (screenId === 'screen-calendar') targetNavId = 'nav-calendar';
    else if (['screen-profile-settings', 'screen-notifications'].includes(screenId)) targetNavId = 'nav-profile';

    if (targetNavId) {
      const activeNav = document.getElementById(targetNavId);
      if (activeNav) activeNav.classList.add('active');
    }
  }

  openModal(modalId) {
    if (window.soundEngine) {
      window.soundEngine.playClick();
    }
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      this.activeModal = modalId;
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId || this.activeModal);
    if (modal) {
      modal.classList.remove('active');
      if (this.activeModal === modalId) {
        this.activeModal = null;
      }
    }
  }
}

window.appRouter = new AppRouter();
