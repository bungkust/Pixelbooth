// Configuration utility for Pixel Booth
// Re-exports from configService for backward compatibility

export { 
  loadConfig, 
  clearConfigCache,
  getConfigOverride,
  setConfigOverride,
  clearConfigOverride,
  getConfigPreview
} from '../services/configService';

export type { Config } from '../services/configService';
