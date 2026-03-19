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
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Apply observer to all reveal elements
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .feature-card, .ai-text, .ai-visual, .cta-card').forEach(el => {
        observer.observe(el);
    });

    // ── Notification System ────────────────────────
    const notificationContainer = document.getElementById('notification-container');

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';

        notification.innerHTML = `
            <span class="notification-icon">${icon}</span>
            <span class="notification-message">${message}</span>
        `;

        notificationContainer.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 400);
        }, 5000);
    }

    // Supabase Configuration
    const SUPABASE_URL = 'https://wycbdsyswuhpozbjhzdu.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5Y2Jkc3lzd3VocG96YmpoemR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzMxNzQsImV4cCI6MjA4ODkwOTE3NH0.wk8RK0Cf30gEGz_AvSUH9Y5QNDcnz7VmkZ_2Aq_ANWQ';
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let currentUser = null;

    // Paddle Configuration
    const PADDLE_CLIENT_TOKEN = 'test_23dbc859d3815f28e4007383eb8';
    
    if (typeof Paddle !== 'undefined') {
        Paddle.Environment.set('sandbox');
    }

    // Auth UI Elements
    const authModal = document.getElementById('auth-modal');
    const loginNavBtn = document.getElementById('login-nav-btn');
    const closeAuthBtn = document.getElementById('close-auth');
    const authForm = document.getElementById('auth-form');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const authTitle = document.getElementById('auth-title');
    const authSubmit = document.getElementById('auth-submit');
    const authSwitchBtn = document.getElementById('auth-switch-btn');
    const authSwitchText = document.getElementById('auth-switch-text');
    const authNav = document.getElementById('auth-nav');
    const userNav = document.getElementById('user-nav');
    const userDisplay = document.getElementById('user-display');
    const logoutBtn = document.getElementById('logout-btn');

    let isLoginMode = true;

    // Toggle Auth Modal
    loginNavBtn?.addEventListener('click', () => {
        authModal.classList.add('active');
        setAuthMode(true);
    });

    closeAuthBtn?.addEventListener('click', () => {
        authModal.classList.remove('active');
    });

    // Switch between Login and Signup
    authSwitchBtn?.addEventListener('click', () => {
        setAuthMode(!isLoginMode);
    });

    function setAuthMode(login) {
        const container = document.getElementById('auth-form-container');
        container.style.opacity = '0';
        container.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            isLoginMode = login;
            authTitle.innerText = login ? 'Welcome Back' : 'Create Account';
            authSubmit.innerText = login ? 'Sign In' : 'Sign Up';
            authSwitchText.innerText = login ? "Don't have an account?" : 'Already have an account?';
            authSwitchBtn.innerText = login ? 'Sign Up' : 'Sign In';
            
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }, 200);
    }

    // Handle Auth Submission
    authForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loadingOverlay = document.getElementById('auth-loading');
        loadingOverlay.classList.add('active');
        authSubmit.disabled = true;

        const email = authEmail.value;
        const password = authPassword.value;

        try {
            let result;
            if (isLoginMode) {
                result = await supabaseClient.auth.signInWithPassword({ email, password });
            } else {
                result = await supabaseClient.auth.signUp({ 
                    email, 
                    password,
                    options: {
                        emailRedirectTo: window.location.origin + '/verify.html'
                    }
                });
            }

            if (result.error) throw result.error;

            if (!isLoginMode && result.data?.user) {
                showNotification('Account created! Please check your email for verification.', 'success');
            } else if (isLoginMode) {
                showNotification('Welcome back!', 'success');
            }
            
            authModal.classList.remove('active');
            authForm.reset();
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            loadingOverlay.classList.remove('active');
            authSubmit.disabled = false;
        }
    });

    // Handle Logout
    logoutBtn?.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
    });

    // Listen for Auth Changes
    supabaseClient.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user || null;
        updateUI();
        
        // If we were waiting for login to manage, do it now
        if (currentUser && new URLSearchParams(window.location.search).get('manage') === 'true') {
            openCustomerPortal();
        }
    });

    // Check for email param in URL (from Electron redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    const manageParam = urlParams.get('manage');
    const authParam = urlParams.get('auth');

    if (manageParam === 'true') {
        const targetEmail = emailParam || (currentUser ? currentUser.email : '');
        if (targetEmail) {
            console.log('[Website] Redirecting to portal for:', targetEmail);
            window.location.href = `https://billing.paddle.com/checkout/customer-portal?email=${encodeURIComponent(targetEmail)}`;
        }
    } else if ((emailParam || authParam === 'true') && !currentUser) {
        if (emailParam) authEmail.value = emailParam;
        authModal.classList.add('active');
        setAuthMode(true);
    }

    function openCustomerPortal() {
        const targetEmail = emailParam || (currentUser ? currentUser.email : '');
        if (typeof Paddle !== 'undefined') {
            console.log('[Website] Opening customer portal for:', targetEmail);
            window.location.href = `https://billing.paddle.com/checkout/customer-portal?email=${encodeURIComponent(targetEmail || '')}`;
        }
    }

    function updateUI() {
        if (currentUser) {
            authNav.style.display = 'none';
            userNav.style.display = 'flex';
            userDisplay.innerText = currentUser.email;
            
            // Update pricing buttons to handle checkout
            document.querySelectorAll('.btn-primary').forEach(btn => {
                if (btn.innerText === 'Start Free Trial') {
                    // Change link to checkout button logic
                    btn.classList.add('checkout-ready');
                }
            });
        } else {
            authNav.style.display = 'flex';
            userNav.style.display = 'none';
            document.querySelectorAll('.checkout-ready').forEach(btn => btn.classList.remove('checkout-ready'));
        }
    }

    // Handle Paddle Events for Checkout & Portal
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.checkout-btn');
        if (btn) {
            if (currentUser) {
                // If logged in, open Paddle Checkout
                e.preventDefault();
                
                // Determine Plan from data-plan attribute
                const plan = btn.getAttribute('data-plan');
                const isAnnual = plan === 'annual';
                
                // Price IDs (Defaulting to test IDs - REPLACE WITH PRODUCTION IDs FOR LAUNCH)
                const priceId = isAnnual ? 'pri_01kksg72kr8s3k1p7s1y5kg9dc' : 'pri_01kksg348fs9mg5qvhmkj4s0jr';
                
                if (typeof Paddle !== 'undefined') {
                    console.log('[Website] Opening checkout for:', currentUser.email, 'Plan:', isAnnual ? 'Annual' : 'Monthly');
                    Paddle.Checkout.open({
                        items: [{ priceId, quantity: 1 }],
                        customer: { email: currentUser.email },
                        customData: { userId: currentUser.id },
                        settings: {
                            displayMode: 'overlay',
                            theme: 'dark',
                            locale: 'en'
                        }
                    });
                }
            } else {
                // Not logged in? Show auth modal and switch to Sign Up
                e.preventDefault();
                const authModal = document.getElementById('auth-modal');
                authModal.style.display = 'flex';
                setAuthMode(false); // Switch to Sign Up mode
            }
        }
    });

    // Listen for Paddle Events globally
    if (typeof Paddle !== 'undefined') {
        Paddle.Initialize({ 
            token: PADDLE_CLIENT_TOKEN,
            eventCallback: async (event) => {
                console.log('[Paddle] Event:', event.name, event.data);
                
                if (event.name === 'checkout.completed') {
                    console.log('[Paddle] Checkout Success! Updating Supabase...');
                    
                    // Update Supabase via the Edge Function or direct update
                    const { error } = await supabaseClient
                        .from('profiles')
                        .update({ is_pro: true })
                        .eq('id', currentUser.id);
                        
                    if (error) {
                        console.error('[Supabase] Update failed:', error);
                    } else {
                        showNotification('Upgrade Successful! Return to Flow to start your journey.', 'success');
                        
                        // Show a big "Return to App" link
                        const successDiv = document.createElement('div');
                        successDiv.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:10000; background:var(--accent); color:#000; padding:20px; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.5); display:flex; flex-direction:column; gap:12px; animation: slideIn 0.5s ease;';
                        successDiv.innerHTML = `
                            <strong style="font-size:18px">🚀 Upgrade Successful!</strong>
                            <p style="font-size:14px">Your Pro account is ready. Open your desktop app to start winning.</p>
                            <a href="flow://auth-callback" class="btn btn-primary" style="background:#000; color:#fff; justify-content:center">Open Flow App</a>
                        `;
                        document.body.appendChild(successDiv);
                    }
                }
            }
        });
    }

    // (openCustomerPortal is defined above now)

    // Custom CSS for observed elements
    const style = document.createElement('style');
    style.textContent = `
        .feature-card, .ai-text, .ai-visual, .cta-card {
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .active {
            opacity: 1 !important;
            transform: translate(0, 0) !important;
        }
    `;
    document.head.appendChild(style);
});
