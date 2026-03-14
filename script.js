// Productive Landing Page Interactions

document.addEventListener('DOMContentLoaded', () => {
    // Navigation bar background transition on scroll
    const nav = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.style.background = 'rgba(10, 10, 15, 0.95)';
            nav.style.height = '70px';
            nav.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
        } else {
            nav.style.background = 'transparent';
            nav.style.height = '80px';
            nav.style.borderBottom = 'none';
        }
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Apply observer to elements
    document.querySelectorAll('.feature-card, .ai-text, .ai-visual, .cta-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        observer.observe(el);
    });

    // Custom CSS for observed elements
    const style = document.createElement('style');
    style.textContent = `
        .visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
});
