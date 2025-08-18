interface MentorConfig {
  mainFlowPrompt: string;
  stuckModePrompt: string;
  triggerWords: string[];
  phaseNames: string[];
}

export class MentorConfigService {
  private static instance: MentorConfigService;
  private configCache: MentorConfig | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): MentorConfigService {
    if (!MentorConfigService.instance) {
      MentorConfigService.instance = new MentorConfigService();
    }
    return MentorConfigService.instance;
  }

  async getConfig(): Promise<MentorConfig> {
    if (this.shouldRefreshCache()) {
      await this.refreshCache();
    }
    return this.configCache!;
  }

  private async refreshCache(): Promise<void> {
    try {
      const response = await fetch(`${process.env.SHEETDB_URL}`);
      const configs = await response.json();

      this.configCache = this.parseConfig(configs);
      this.lastFetch = Date.now();
    } catch (error) {
      console.error('Failed to refresh mentor config:', error);
      throw new Error('Failed to load mentor configuration from SheetDB');
    }
  }

  private parseConfig(configs: any[]): MentorConfig {
    const configMap = new Map(configs.map(c => [c.config_key, c.config_value]));
    
    return {
      mainFlowPrompt: configMap.get('main_flow_prompt') || '',
      stuckModePrompt: configMap.get('stuck_mode_prompt') || '',
      triggerWords: (configMap.get('trigger_words') || 'begin,start').split(','),
      phaseNames: (configMap.get('phase_names') || 'assessment,recommendation,guidance').split(',')
    };
  }

  private shouldRefreshCache(): boolean {
    return !this.configCache || (Date.now() - this.lastFetch) > this.CACHE_DURATION;
  }
}
