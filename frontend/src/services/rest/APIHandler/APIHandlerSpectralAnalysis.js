import APIHandlerBase from './APIHandlerBase';
import { APIHandlerError } from './Errors';

export class APIHandlerSpectralAnalysis extends APIHandlerBase {
  /**
   * List the signed-in user's recordings without their audio payloads.
   *
   * This is intentionally separate from the dashboard "recent data" feed,
   * which only includes recordings that also have weather rows.
   */
  async getAudioFiles() {
    try {
      return await this.request('/api/audio/all');
    } catch (error) {
      throw new APIHandlerError(`Could not load recordings: ${error.message}`);
    }
  }
}

export default APIHandlerSpectralAnalysis;
