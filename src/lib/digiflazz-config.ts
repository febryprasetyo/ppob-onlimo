/**
 * Digiflazz Configuration Utility
 * Gunakan file ini untuk mengatur mode (dev/prod) dan credentials
 */

const MODE = process.env.DIGIFLAZZ_MODE || 'dev';

export const DIGIFLAZZ_CONFIG = {
  username: (process.env.DIGIFLAZZ_USERNAME || '').trim(),
  apiKey: MODE === 'prod' 
    ? (process.env.DIGIFLAZZ_API_KEY_PROD || '').trim() 
    : (process.env.DIGIFLAZZ_API_KEY_DEV || '').trim(),
  mode: MODE,
  isProd: MODE === 'prod'
};
