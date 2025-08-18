export interface CareerConfig {
  discoverStepPrompt: string;
  commitStepPrompt: string;
  createStepPrompt: string;
  careerSteps: string[];
  // Essential flow prompts only
  jobSearchTermsPrompt: string;
}

export class CareerConfigService {
  private static instance: CareerConfigService;
  private configCache: CareerConfig | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): CareerConfigService {
    if (!CareerConfigService.instance) {
      CareerConfigService.instance = new CareerConfigService();
    }
    return CareerConfigService.instance;
  }

  async getConfig(): Promise<CareerConfig> {
    if (this.shouldRefreshCache()) {
      await this.refreshCache();
    }
    return this.configCache!;
  }

  private async refreshCache(): Promise<void> {
    try {
      const response = await fetch(`${process.env.CAREER_SHEETDB_URL}`);
      const configs = await response.json();

      this.configCache = this.parseConfig(configs);
      this.lastFetch = Date.now();
    } catch (error) {
      console.error('Failed to refresh career config:', error);
      throw new Error('Failed to load career configuration from SheetDB');
    }
  }

  private parseConfig(configs: any[]): CareerConfig {
    // Debug: Log the exact structure from SheetDB
    
    // Your SheetDB has flat structure, not key-value pairs
    // Find the row with actual data (first row that has content)
    const dataRow = configs.find(row => row.discover_step_prompt && row.discover_step_prompt.length > 0);
    
    if (!dataRow) {
      console.error("❌ No data row found in SheetDB response");
      throw new Error("No valid data found in SheetDB");
    }

    // Debug: Log what we're getting from SheetDB
    console.log('🔍 Raw SheetDB config:', {
      discoverStepPrompt: dataRow.discover_step_prompt?.substring(0, 100) + '...',
      commitStepPrompt: dataRow.commit_step_prompt?.substring(0, 100) + '...',
      createStepPrompt: dataRow.create_step_prompt?.substring(0, 100) + '...',
      careerSteps: dataRow.career_steps,
      jobSearchTermsPrompt: dataRow.job_search_terms_prompt?.substring(0, 100) + '...'
    });
    
    return {
      discoverStepPrompt: dataRow.discover_step_prompt || '',
      commitStepPrompt: dataRow.commit_step_prompt || '',
      createStepPrompt: dataRow.create_step_prompt || '',
      careerSteps: dataRow.career_steps ? dataRow.career_steps.split(',') : [],
      // Essential flow prompts only
      jobSearchTermsPrompt: dataRow.job_search_terms_prompt || ''
    };
  }

  private shouldRefreshCache(): boolean {
    return !this.configCache || (Date.now() - this.lastFetch) > this.CACHE_DURATION;
  }
}
