(() => {
  const MOBILE_BREAKPOINT = 720;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Mobile menu ──────────────────────────────
  const burger = document.getElementById('burger');
  const menu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('menu-overlay');

  function setMenu(open) {
    if (!burger || !menu || !overlay) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    overlay.hidden = !open;
    document.body.classList.toggle('menu-open', open);
  }

  burger?.addEventListener('click', () => {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  overlay?.addEventListener('click', () => setMenu(false));
  menu?.querySelectorAll('a, button').forEach((el) => {
    el.addEventListener('click', () => setMenu(false));
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > MOBILE_BREAKPOINT) setMenu(false);
  });

  // ── Stat count-up ────────────────────────────
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const statValues = Array.from(document.querySelectorAll('.stat-value'));

  function formatStat(value, decimals, suffix) {
    return (
      value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }) + suffix
    );
  }

  function runCount(el, i) {
    const target = parseFloat(el.dataset.target) || 0;
    const decimals = parseInt(el.dataset.decimals, 10) || 0;
    const suffix = el.dataset.suffix || '';

    if (reducedMotion) {
      el.textContent = formatStat(target, decimals, suffix);
      return;
    }

    const duration = 1500 + i * 80;
    setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const factor = Math.pow(10, decimals);
        const value = Math.round(target * easeOutCubic(t) * factor) / factor;
        el.textContent = formatStat(value, decimals, suffix);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 480 + i * 90);
  }

  if ('IntersectionObserver' in window) {
    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCount(entry.target, statValues.indexOf(entry.target));
          statObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.25 }
    );
    statValues.forEach((el) => statObserver.observe(el));
  } else {
    statValues.forEach(runCount);
  }

  // ── Scroll reveal ────────────────────────────
  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach((el) => {
    const siblings = Array.from(el.parentElement.children).filter((c) => c.classList.contains('reveal'));
    const index = siblings.indexOf(el);
    if (index > 0) el.style.setProperty('--rd', `${Math.min(index, 6) * 0.06}s`);
  });

  if (reducedMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-in'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach((el) => revealObserver.observe(el));
  }

  // ── Notifications ────────────────────────────
  const notificationContainer = document.getElementById('notification-container');

  function showNotification(message, type = 'info') {
    if (!notificationContainer) return;
    const icons = {
      info: 'fa-solid fa-circle-info',
      success: 'fa-solid fa-circle-check',
      error: 'fa-solid fa-circle-exclamation',
    };
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const icon = document.createElement('i');
    icon.className = `notification-icon ${icons[type] || icons.info}`;
    const text = document.createElement('span');
    text.textContent = message;
    notification.append(icon, text);
    notificationContainer.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 400);
    }, 5000);
  }

  // ── Supabase auth ────────────────────────────
  const siteConfig = window.FLOW_SITE_CONFIG || {};
  const SUPABASE_URL = (siteConfig.supabaseUrl || '').trim();
  const SUPABASE_ANON_KEY = (siteConfig.supabaseAnonKey || '').trim();

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[Website] Missing config.js — run: npm run website:config');
    showNotification('Site configuration missing. Run npm run website:config from the project root.', 'error');
  }

  const supabaseClient =
    SUPABASE_URL && SUPABASE_ANON_KEY && typeof supabase !== 'undefined'
      ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : null;

  function requireSupabase() {
    if (!supabaseClient) {
      showNotification('Site not configured. Run: npm run website:config', 'error');
      return false;
    }
    return true;
  }

  let currentUser = null;

  const authModal = document.getElementById('auth-modal');
  const closeAuthBtn = document.getElementById('close-auth');
  const authForm = document.getElementById('auth-form');
  const authEmail = document.getElementById('auth-email');
  const authPassword = document.getElementById('auth-password');
  const authTitle = document.getElementById('auth-title');
  const authSubtitle = document.getElementById('auth-subtitle');
  const authSubmit = document.getElementById('auth-submit');
  const authSwitchBtn = document.getElementById('auth-switch-btn');
  const authSwitchText = document.getElementById('auth-switch-text');
  const authLoading = document.getElementById('auth-loading');
  const signInButtons = document.querySelectorAll('.js-signin');

  let isLoginMode = true;

  function openAuth(login = true) {
    authModal.classList.add('active');
    document.body.classList.add('modal-open');
    setAuthMode(login);
  }

  function closeAuth() {
    authModal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  function setAuthMode(login) {
    const container = document.getElementById('auth-form-container');
    container.style.opacity = '0';
    container.style.transform = 'translateY(10px)';

    setTimeout(() => {
      isLoginMode = login;
      authTitle.textContent = login ? 'Welcome Back' : 'Create Account';
      authSubtitle.textContent = login ? 'Sign in to your Flow account' : 'Start your 3-day free Pro trial';
      authSubmit.textContent = login ? 'Sign In' : 'Sign Up';
      authSwitchText.textContent = login ? "Don't have an account?" : 'Already have an account?';
      authSwitchBtn.textContent = login ? 'Sign Up' : 'Sign In';
      authPassword.setAttribute('autocomplete', login ? 'current-password' : 'new-password');
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
    }, 200);
  }

  signInButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (currentUser) {
        if (!requireSupabase()) return;
        await supabaseClient.auth.signOut();
        showNotification('Successfully logged out.', 'info');
        return;
      }
      openAuth(true);
    });
  });

  closeAuthBtn?.addEventListener('click', closeAuth);
  authModal?.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuth();
  });
  authSwitchBtn?.addEventListener('click', () => setAuthMode(!isLoginMode));

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (authModal?.classList.contains('active')) closeAuth();
    else if (document.body.classList.contains('menu-open')) {
      setMenu(false);
      burger?.focus();
    }
  });

  authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!requireSupabase()) return;
    authLoading.classList.add('active');
    authSubmit.disabled = true;

    const email = authEmail.value;
    const password = authPassword.value;

    try {
      const result = isLoginMode
        ? await supabaseClient.auth.signInWithPassword({ email, password })
        : await supabaseClient.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin + '/verify.html' },
          });

      if (result.error) throw result.error;

      if (!isLoginMode && result.data?.user) {
        showNotification('Account created! Please check your email for verification.', 'success');
      } else if (isLoginMode) {
        showNotification('Welcome back!', 'success');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }

      closeAuth();
      authForm.reset();
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      authLoading.classList.remove('active');
      authSubmit.disabled = false;
    }
  });

  document.getElementById('google-login-btn')?.addEventListener('click', async () => {
    if (!requireSupabase()) return;
    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocal ? window.location.origin : 'https://flowdaily.org';
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${baseUrl}/auth-callback.html` },
      });
      if (error) throw error;
    } catch (error) {
      showNotification(error.message, 'error');
    }
  });

  function updateUI() {
    signInButtons.forEach((btn) => {
      btn.textContent = currentUser ? 'Sign out' : 'Sign in';
      if (currentUser) btn.title = `Signed in as ${currentUser.email}`;
      else btn.removeAttribute('title');
    });
    document.querySelectorAll('.checkout-btn').forEach((btn) => {
      btn.classList.toggle('checkout-ready', Boolean(currentUser));
    });
  }

  supabaseClient?.auth.onAuthStateChange((event, session) => {
    const prevUser = currentUser;
    currentUser = session?.user || null;
    updateUI();
    if (currentUser && !prevUser && event === 'SIGNED_IN') {
      showNotification(`Welcome back, ${currentUser.email}!`, 'success');
    }
  });

  supabaseClient?.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      currentUser = session.user;
      updateUI();
    }
  });

  // ── Billing portal ───────────────────────────
  async function openManagePortal(targetEmail) {
    const params = new URLSearchParams();
    if (targetEmail) params.set('email', targetEmail);

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        params.set('error', 'sign_in');
        window.location.href = `manage.html?${params}`;
        return;
      }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/paddle-portal`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }

      if (data.error) params.set('error', data.error);
      if (res.status) params.set('status', String(res.status));
    } catch (err) {
      console.warn('[Website] Portal session failed:', err);
      params.set('error', 'network');
    }

    window.location.href = `manage.html?${params}`;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const emailParam = urlParams.get('email');
  const manageParam = urlParams.get('manage');
  const authParam = urlParams.get('auth');

  if (manageParam === 'true' && supabaseClient) {
    openManagePortal(emailParam || '');
  } else if ((emailParam || authParam === 'true') && !currentUser && authModal) {
    if (emailParam) authEmail.value = emailParam;
    openAuth(true);
  }

  // ── Paddle checkout ──────────────────────────
  const PADDLE_CLIENT_TOKEN = (siteConfig.paddleClientToken || '').trim();
  const PADDLE_PRICE_IDS = siteConfig.paddlePriceIds || {
    pro: { monthly: '', annual: '' },
    pro_max: { monthly: '', annual: '' },
  };
  const hasPaddle = typeof Paddle !== 'undefined';

  if (hasPaddle) {
    Paddle.Environment.set(PADDLE_CLIENT_TOKEN.startsWith('test_') ? 'sandbox' : 'production');
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.checkout-btn');
    if (!btn) return;
    e.preventDefault();

    if (!currentUser) {
      showNotification('Please Sign In first to create your Pro account.', 'info');
      openAuth(false);
      return;
    }

    const plan = btn.getAttribute('data-plan') || 'monthly';
    const tier = btn.getAttribute('data-tier') || 'pro';
    const tierPrices = PADDLE_PRICE_IDS[tier] || PADDLE_PRICE_IDS.pro;
    const priceId = tierPrices[plan] || tierPrices.monthly;
    if (!priceId) {
      showNotification('Pro Max checkout: start your 3-day free trial in the Flow app, or contact support@flowdaily.org.', 'info');
      return;
    }

    if (hasPaddle) {
      Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email: currentUser.email },
        customData: { userId: currentUser.id, tier },
        settings: { displayMode: 'overlay', theme: 'dark', locale: 'en' },
      });
    }
  });

  function showUpgradeSuccess() {
    const box = document.createElement('div');
    box.className = 'notification';
    box.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:1000;flex-direction:column;align-items:flex-start;gap:10px;padding:20px;border-radius:20px;max-width:320px;';
    box.innerHTML = `
      <strong style="font-size:16px">Upgrade successful</strong>
      <span style="font-weight:400">Your Pro account is ready. Open your desktop app to start winning.</span>
      <a href="flow://auth-callback" class="btn btn-light" style="background:#000;color:#fff;box-shadow:none">Open Flow App</a>
    `;
    document.body.appendChild(box);
  }

  if (hasPaddle && PADDLE_CLIENT_TOKEN) {
    Paddle.Initialize({
      token: PADDLE_CLIENT_TOKEN,
      eventCallback: async (event) => {
        if (typeof event.name === 'string' && event.name.includes('error')) {
          const detail = event.data?.detail || event.detail || 'Unknown error';
          if (detail.includes('transaction_checkout_not_enabled')) {
            showNotification('Paddle Account Error: Live checkout is not yet enabled for your account. Please check your Paddle Dashboard status.', 'error');
          } else {
            showNotification(`Checkout Error: ${detail}`, 'error');
          }
          return;
        }

        if (event.name === 'checkout.completed') {
          if (!requireSupabase() || !currentUser) return;

          const tier = event.data?.custom_data?.tier || 'pro';
          const paddleCustomerId = event.data?.customer?.id || null;
          const { error } = await supabaseClient
            .from('profiles')
            .update({
              is_pro: true,
              subscription_tier: tier,
              ...(paddleCustomerId ? { paddle_customer_id: paddleCustomerId } : {}),
            })
            .eq('id', currentUser.id);

          if (error) {
            console.error('[Supabase] Update failed:', error);
          } else {
            showNotification('Upgrade Successful! Return to Flow to start your journey.', 'success');
            showUpgradeSuccess();
          }
        }
      },
    });

    const priceParam = urlParams.get('priceId');
    const userParam = urlParams.get('userId');
    const tierParam = urlParams.get('tier') || 'pro';

    if (priceParam) {
      setTimeout(() => {
        Paddle.Checkout.open({
          items: [{ priceId: priceParam, quantity: 1 }],
          customer: emailParam && emailParam !== 'undefined' ? { email: emailParam } : undefined,
          customData: userParam && userParam !== 'undefined' ? { userId: userParam, tier: tierParam } : undefined,
          settings: { displayMode: 'overlay', theme: 'dark', locale: 'en' },
        });
      }, 1000);
    }
  }
})();
