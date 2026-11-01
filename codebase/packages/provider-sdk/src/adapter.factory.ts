import type { VideoProviderAdapter } from '@videoforge/shared-types';
import { AlibabaWanAdapter } from './adapters/alibaba-wan.adapter';
import { MinimaxAdapter } from './adapters/minimax.adapter';
import { RunwayAdapter } from './adapters/runway.adapter';
import { LumaAdapter } from './adapters/luma.adapter';
import { KlingAdapter } from './adapters/kling.adapter';

export class VideoProviderAdapterFactory {
  private static readonly adapters = new Map<string, VideoProviderAdapter>([
    ['alibaba-wan', new AlibabaWanAdapter()],
    ['minimax-hailuo', new MinimaxAdapter()],
    ['runway', new RunwayAdapter()],
    ['luma', new LumaAdapter()],
    ['kling', new KlingAdapter()],
  ]);

  /**
   * Resolves a video provider adapter instance by providerId.
   * Throws an error if the provider is unsupported or not implemented.
   */
  static getAdapter(providerId: string): VideoProviderAdapter {
    const normalizedId = providerId.toLowerCase().trim();
    const adapter = this.adapters.get(normalizedId);
    if (!adapter) {
      throw new Error(
        `Provider adapter for '${providerId}' is not implemented or supported. Supported providers: ${Array.from(this.adapters.keys()).join(', ')}`,
      );
    }
    return adapter;
  }

  /**
   * Returns list of all implemented provider IDs.
   */
  static getSupportedProviderIds(): string[] {
    return Array.from(this.adapters.keys());
  }
}
