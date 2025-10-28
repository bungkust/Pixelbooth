// Configuration management service for Pixel Booth
// Handles both config.txt and localStorage overrides

export interface Config {
  mainText: string;
  subText: string;
}

export interface ConfigOverride {
  mainText?: string;
  subText?: string;
  enabled: boolean;
}

let cachedConfig: Config | null = null;

export async function loadConfig(): Promise<Config> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    // Load from localStorage override
    const override = getConfigOverride();
    if (override.enabled) {
      cachedConfig = {
        mainText: override.mainText || 'Pixel Booth',
        subText: override.subText || '2025'
      };
      return cachedConfig;
    }

    // Default values if no override
    cachedConfig = { mainText: 'Pixel Booth', subText: '2025' };
    return cachedConfig;
  } catch (error) {
    console.warn('Failed to load config, using defaults:', error);
    cachedConfig = { mainText: 'Pixel Booth', subText: '2025' };
    return cachedConfig;
  }
}

export function getConfigOverride(): ConfigOverride {
  try {
    const stored = localStorage.getItem('pixelbooth_config_override');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to parse config override:', error);
  }
  
  return {
    enabled: false,
    mainText: '',
    subText: ''
  };
}

export function setConfigOverride(config: ConfigOverride): void {
  try {
    localStorage.setItem('pixelbooth_config_override', JSON.stringify(config));
    clearConfigCache(); // Clear cache so next load uses new config
  } catch (error) {
    console.error('Failed to save config override:', error);
    throw new Error('Failed to save configuration');
  }
}

export function clearConfigOverride(): void {
  try {
    localStorage.removeItem('pixelbooth_config_override');
    clearConfigCache();
  } catch (error) {
    console.error('Failed to clear config override:', error);
  }
}

export function clearConfigCache() {
  cachedConfig = null;
}

export function getConfigPreview(): string {
  const override = getConfigOverride();
  if (override.enabled) {
    return `${override.mainText || 'Pixel Booth'}\n${override.subText || '2025'}`;
  }
  return 'Using config.txt values';
}
