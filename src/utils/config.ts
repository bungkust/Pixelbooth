// Configuration utility for Pixel Booth
// Reads config.txt from public folder

interface Config {
  mainText: string;
  subText: string;
}

let cachedConfig: Config | null = null;

export async function loadConfig(): Promise<Config> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await fetch('/config.txt');
    const text = await response.text();
    
    const lines = text.split('\n');
    let mainText = 'Pixel Booth';
    let subText = '2025';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('MAIN_TEXT=')) {
        mainText = trimmedLine.substring(10).trim();
      } else if (trimmedLine.startsWith('SUB_TEXT=')) {
        subText = trimmedLine.substring(9).trim();
      }
    }

    cachedConfig = { mainText, subText };
    return cachedConfig;
  } catch (error) {
    console.warn('Failed to load config.txt, using defaults:', error);
    cachedConfig = { mainText: 'Pixel Booth', subText: '2025' };
    return cachedConfig;
  }
}

export function clearConfigCache() {
  cachedConfig = null;
}
