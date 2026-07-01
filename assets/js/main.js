/**
 * Noneface Blog — Main JavaScript
 * Dark mode toggle + Mobile nav menu
 * Zero dependencies
 */
(function () {
    'use strict';

    // ============================
    // Dark Mode Toggle
    // ============================
    var STORAGE_KEY = 'theme';
    var DARK_CLASS = 'dark';
    var html = document.documentElement;
    var toggleBtn = document.getElementById('theme-toggle');
    var toggleIcon = toggleBtn ? toggleBtn.querySelector('i') : null;

    function getPreferredTheme() {
        var stored = localStorage.getItem(STORAGE_KEY);
        if (stored === DARK_CLASS || stored === 'light') return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK_CLASS : 'light';
    }

    function applyTheme(theme) {
        if (theme === DARK_CLASS) {
            html.setAttribute('data-theme', DARK_CLASS);
            if (toggleIcon) {
                toggleIcon.classList.remove('fa-moon');
                toggleIcon.classList.add('fa-sun');
            }
        } else {
            html.removeAttribute('data-theme');
            if (toggleIcon) {
                toggleIcon.classList.remove('fa-sun');
                toggleIcon.classList.add('fa-moon');
            }
        }
    }

    function toggleTheme() {
        var current = html.hasAttribute('data-theme') ? DARK_CLASS : 'light';
        var next = current === DARK_CLASS ? 'light' : DARK_CLASS;
        localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);
    }

    if (toggleBtn) {
        applyTheme(getPreferredTheme());
        toggleBtn.addEventListener('click', toggleTheme);
    }

    // ============================
    // Mobile Nav Menu
    // ============================
    var menuToggle = document.getElementById('menu-toggle');
    var siteNav = document.getElementById('site-nav');

    if (menuToggle && siteNav) {
        menuToggle.addEventListener('click', function () {
            var isOpen = siteNav.classList.toggle('open');
            var icon = menuToggle.querySelector('i');
            if (icon) {
                if (isOpen) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-xmark');
                } else {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Close menu when a link is clicked
        var links = siteNav.querySelectorAll('a');
        for (var i = 0; i < links.length; i++) {
            links[i].addEventListener('click', function () {
                siteNav.classList.remove('open');
                var icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            });
        }
    }
})();
