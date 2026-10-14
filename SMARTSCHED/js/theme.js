// SMARTSCHED - Theme & Global UX Script
(function () {
    // Theme Management
    const THEME_KEY = 'smartsched_theme';
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
        
        // Update any toggle switches on the page
        document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
            btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
            const icon = btn.querySelector('.theme-icon');
            const label = btn.querySelector('.theme-label');
            if (icon) {
                icon.textContent = theme === 'dark' ? '🌙' : '☀️';
            }
            if (label) {
                label.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
            }
            if (btn.classList.contains('switch-slider')) {
                btn.classList.toggle('active', theme === 'light');
            }
        });
    }

    // Apply saved theme immediately to prevent flashing
    applyTheme(savedTheme);

    // Expose toggle function globally
    window.toggleTheme = function () {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        showToast(next === 'dark' ? '🌙 Switched to Dark Mode' : '☀️ Switched to Light Mode');
    };

    // Toast Notification System
    window.showToast = function (message, duration = 2500) {
        let toast = document.querySelector('.app-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'app-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(window._toastTimeout);
        window._toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    };

    // Mobile Sidebar Toggle
    window.toggleSidebar = function () {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('open');
            const overlay = document.querySelector('.sidebar-overlay');
            if (overlay) {
                overlay.classList.toggle('open');
            }
        }
    };

    // DomContentLoaded setup
    document.addEventListener('DOMContentLoaded', () => {
        applyTheme(localStorage.getItem(THEME_KEY) || 'dark');

        // Close sidebar on link click (mobile)
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.addEventListener('click', () => {
                const sidebar = document.querySelector('.sidebar');
                if (sidebar && sidebar.classList.contains('open')) {
                    toggleSidebar();
                }
            });
        });
    });
})();
