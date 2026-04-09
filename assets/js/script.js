// Flow Landing Page Interactions

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

    // Mobile hamburger menu toggle
    const hamburger = document.getElementById('nav-hamburger');
    const navLinks = document.getElementById('nav-links');
    hamburger?.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('mobile-open');
        hamburger.classList.toggle('open', isOpen);
        hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });
    // Close mobile menu when a link is clicked
    navLinks?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('mobile-open');
            hamburger?.classList.remove('open');
        });
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

    // Check current session on startup AS EARLY AS POSSIBLE
    console.log('[Auth] Checking initial session...');
    
    // Explicitly handle hash fragment for some browsers
    if (window.location.hash.includes('access_token')) {
        console.log('[Auth] Access token detected in fragment.');
    }

    supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('[Auth] State change event:', event);
        const prevUser = currentUser;
        currentUser = session?.user || null;
        updateUI();
        
        if (currentUser && !prevUser) {
            showNotification(`Welcome back, ${currentUser.email}!`, 'success');
        }
    });

    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            console.log('[Auth] Session found on load:', session.user.email);
            currentUser = session.user;
            updateUI();
        }
    });

    // Paddle Configuration
    const PADDLE_CLIENT_TOKEN = 'live_8530a6727826bbe9f96b781f6ac';
    
    if (typeof Paddle !== 'undefined') {
        Paddle.Environment.set('production');
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
                // Force return to home page on success
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
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

    // Google Sign In
    const googleLoginBtn = document.getElementById('google-login-btn');
    googleLoginBtn?.addEventListener('click', async () => {
        try {
            // Use explicit production URL in production, dynamic URL in development
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const baseUrl = isLocal ? window.location.origin : 'https://flowdaily.org';
            const redirectTo = `${baseUrl}/auth-callback.html`;

            const { error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo }
            });
            if (error) throw error;
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    // Handle Logout
    logoutBtn?.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        showNotification('Successfully logged out.', 'info');
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
            e.preventDefault();
            if (currentUser) {
                const plan = btn.getAttribute('data-plan') || 'monthly';
                const tier = btn.getAttribute('data-tier') || 'pro';
                const priceId = plan === 'annual' ? 'pri_01km3sj8nbreym8m0zp4qx9rnn'
                              : plan === 'weekly' ? 'pri_01knq5qp0nw5ev9fpp9swvpx95'
                              : 'pri_01km3sfrvp1htyt0kb3tnjt1jv';

                console.log(`[Paddle] Opening ${plan} checkout:`, priceId);

                if (typeof Paddle !== 'undefined') {
                    Paddle.Checkout.open({
                        items: [{ priceId: priceId, quantity: 1 }],
                        customer: { email: currentUser.email },
                        customData: { userId: currentUser.id, tier: tier },
                        settings: {
                            displayMode: 'overlay',
                            theme: 'dark',
                            locale: 'en'
                        }
                    });
                }
            } else {
                showNotification('Please Sign In first to create your Pro account.', 'info');
                authModal.classList.add('active');
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
                
                if (event.name && typeof event.name === 'string' && event.name.includes('error')) {
                    const detail = event.data?.detail || event.detail || 'Unknown error';
                    if (detail.includes('transaction_checkout_not_enabled')) {
                        showNotification('Paddle Account Error: Live checkout is not yet enabled for your account. Please check your Paddle Dashboard status.', 'error');
                    } else {
                        showNotification(`Checkout Error: ${detail}`, 'error');
                    }
                    return;
                }

                if (event.name === 'checkout.completed') {
                    console.log('[Paddle] Checkout Success! Updating Supabase...');
                    
                    // Update Supabase via the Edge Function or direct update
                    const { error } = await supabaseClient
                        .from('profiles')
                        .update({ is_pro: true, subscription_tier: 'pro' })
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
        
        // Auto-Trigger Checkout if Price ID is present in URL
        const priceParam = urlParams.get('priceId');
        const userParam = urlParams.get('userId');
        const emailParam = urlParams.get('email');
        const tierParam = urlParams.get('tier') || 'pro';

        if (priceParam && typeof Paddle !== 'undefined') {
            console.log('[Website] Auto-triggering checkout for Price:', priceParam);
            setTimeout(() => {
                Paddle.Checkout.open({
                    items: [{ priceId: priceParam, quantity: 1 }],
                    customer: (emailParam && emailParam !== 'undefined') ? { email: emailParam } : undefined,
                    customData: (userParam && userParam !== 'undefined') ? { userId: userParam, tier: tierParam } : undefined,
                    settings: {
                        displayMode: 'overlay',
                        theme: 'dark',
                        locale: 'en'
                    }
                });
            }, 1000); // Small delay to ensure everything is ready
        }
    }

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
