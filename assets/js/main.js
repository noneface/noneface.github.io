/**
 * Noneface Blog — Main JavaScript
 * Dark mode toggle + Mobile nav menu + Active nav + a11y
 * Zero dependencies
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'theme';
    var DARK_CLASS = 'dark';
    var html = document.documentElement;
    var toggleBtn = document.getElementById('theme-toggle');
    var toggleIcon = toggleBtn ? toggleBtn.querySelector('i') : null;

    // ============================
    // Dark Mode Toggle
    // ============================

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
        // FOUC prevention (inline <head> script) handles initial theme;
        // sync icon state here
        if (html.hasAttribute('data-theme')) {
            if (toggleIcon) {
                toggleIcon.classList.remove('fa-moon');
                toggleIcon.classList.add('fa-sun');
            }
        }
        toggleBtn.addEventListener('click', toggleTheme);
    }

    // Respond to OS-level theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (localStorage.getItem(STORAGE_KEY)) return; // user preference overrides OS
        applyTheme(e.matches ? DARK_CLASS : 'light');
    });

    // ============================
    // Mobile Nav Menu
    // ============================
    var menuToggle = document.getElementById('menu-toggle');
    var siteNav = document.getElementById('site-nav');

    if (menuToggle && siteNav) {
        var menuIcon = menuToggle.querySelector('i');

        menuToggle.addEventListener('click', function () {
            var isOpen = siteNav.classList.toggle('open');
            document.body.classList.toggle('menu-open', isOpen);
            menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            if (menuIcon) {
                if (isOpen) {
                    menuIcon.classList.remove('fa-bars');
                    menuIcon.classList.add('fa-xmark');
                } else {
                    menuIcon.classList.remove('fa-xmark');
                    menuIcon.classList.add('fa-bars');
                }
            }
        });

        // Close menu when a link is clicked
        var links = siteNav.querySelectorAll('a');
        for (var i = 0; i < links.length; i++) {
            links[i].addEventListener('click', function () {
                siteNav.classList.remove('open');
                document.body.classList.remove('menu-open');
                menuToggle.setAttribute('aria-expanded', 'false');
                if (menuIcon) {
                    menuIcon.classList.remove('fa-xmark');
                    menuIcon.classList.add('fa-bars');
                }
            });
        }

        // Close menu when clicking the backdrop overlay
        document.body.addEventListener('click', function (e) {
            if (!document.body.classList.contains('menu-open')) return;
            if (!siteNav.contains(e.target) && e.target !== menuToggle && !menuToggle.contains(e.target)) {
                siteNav.classList.remove('open');
                document.body.classList.remove('menu-open');
                menuToggle.setAttribute('aria-expanded', 'false');
                if (menuIcon) {
                    menuIcon.classList.remove('fa-xmark');
                    menuIcon.classList.add('fa-bars');
                }
            }
        });
    }

    // ============================
    // Active Nav Link
    // ============================
    var navLinks = document.querySelectorAll('.nav-link');
    var currentPath = window.location.pathname;
    for (var j = 0; j < navLinks.length; j++) {
        var href = navLinks[j].getAttribute('href');
        if (href === currentPath || (href !== '/' && currentPath.indexOf(href) === 0)) {
            navLinks[j].classList.add('active');
            break;
        }
    }
})();
