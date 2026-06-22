/**
 * Copy to config.js (gitignored) or run: npm run website:config
 * Values are loaded from the project root .env file.
 */
window.FLOW_SITE_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
  paddleClientToken: 'live_YOUR_PADDLE_CLIENT_TOKEN',
  pricing: {
    pro: { monthly: '$9.99', annual: '$59.99', apiBudgetMonthlyUsd: 2 },
    pro_max: { monthly: '$19.99', annual: '$143.99', apiBudgetMonthlyUsd: 6 },
    trialDays: 7,
  },
  paddlePriceIds: {
    pro: {
      monthly: '',
      annual: '',
    },
    pro_max: {
      monthly: '',
      annual: '',
    },
  },
};
