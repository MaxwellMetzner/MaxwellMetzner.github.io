document.addEventListener("DOMContentLoaded", () => {
    console.log("Script loaded successfully");

    const themeToggle = document.getElementById("theme-toggle");
    const themeStatus = document.getElementById("theme-status");
    const body = document.body;

    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        body.classList.add(savedTheme);
        themeToggle.textContent = savedTheme === "dark-mode" ? "☀️" : "🌙";
    }

    themeToggle.addEventListener("click", () => {
        const isDarkMode = body.classList.toggle("dark-mode");
        themeToggle.textContent = isDarkMode ? "☀️" : "🌙";
        if (themeStatus) {
            themeStatus.textContent = isDarkMode ? "Dark mode enabled" : "Light mode enabled";
        } else {
            console.warn("themeStatus element not found in the DOM.");
        }
        localStorage.setItem("theme", isDarkMode ? "dark-mode" : "");
    });

    const scrollToTopButton = document.getElementById("scroll-to-top");

    window.addEventListener("scroll", () => {
        if (window.scrollY > 300) {
            scrollToTopButton.style.display = "block";
        } else {
            scrollToTopButton.style.display = "none";
        }
    });

    scrollToTopButton.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
});