import AnnotationReportResponse from '../ResponseORM/Annotations/AnnotationReportResponse';
import APIHandlerBase from './APIHandlerBase';
import { APIHandlerError } from './Errors';

export class APIHandlerAnnotations extends APIHandlerBase {
  /**
   * Load the authoritative report for one recording.
   *
   * @param {number} afid
   * @returns {Promise<AnnotationReportResponse>}
   */
  async getReport(afid) {
    const id = Number(afid);
    if (!Number.isInteger(id) || id < 1) {
      throw new APIHandlerError(
        'A valid audio file identifier is required to load annotations.',
      );
    }

    try {
      const data = await this.request(`/api/annotations/report/${id}`);
      return new AnnotationReportResponse(data);
    } catch (error) {
      throw new APIHandlerError(
        `Could not load the annotation report: ${error.message}`,
      );
    }
  }

  /**
   * Save a complete manual report.
   *
   * BackendError is intentionally propagated unchanged so callers can detect a
   * 409 conflict and read `latest_report_id` from the response detail.
   *
   * @param {import('../../RequestORM/Annotations/SaveAnnotationReportRequest').default} saveRequest
   */
  async saveReport(saveRequest) {
    return this.request('/api/annotations/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saveRequest.toJSON()),
    });
  }
}

export default APIHandlerAnnotations;
