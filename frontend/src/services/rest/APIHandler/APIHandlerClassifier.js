import APIHandlerBase from './APIHandlerBase';
import { APIHandlerError } from './Errors';
import ClassifierReport from '../ResponseORM/Classifier/ClassifierReport';
import { ClassifyAudioRequest } from '../RequestORM/Classifier/ClassifyAudioRequest';

export class APIHandlerClassifier extends APIHandlerBase {
  /**
   * @param {ClassifyAudioRequest} classifyAudioRequest
   * @returns {Promise<ClassifierReport>}
   */
  async fetchClassification(classifyAudioRequest) {
    try {
      const data = await this.request('/api/classifier/classify', {
        method: 'POST',
        body: classifyAudioRequest.toFormData(),
      });
      return new ClassifierReport(data);
    } catch (error) {
      throw new APIHandlerError(`Could not classify the audio file: ${error.message}`);
    }
  }
}

export default APIHandlerClassifier;
