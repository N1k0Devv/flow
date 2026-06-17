/**
 * Copy to config.js (gitignored) or run: npm run website:config
 * Values are loaded from the project root .env file.
 */
window.FLOW_SITE_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
  paddleClientToken: 'live_YOUR_PADDLE_CLIENT_TOKEN',
  paddlePriceIds: {
    pro: {
      weekly: '',
      monthly: '',
      annual: '',
    },
    pro_max: {
      weekly: '',
      monthly: '',
      annual: '',
    },
  },
};
