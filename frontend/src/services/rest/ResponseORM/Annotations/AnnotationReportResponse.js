import { SPECIES } from '../../../../components/classifier/species.js';

export class AnnotationSliceReport {
  constructor(apiSlice = {}) {
    this.window_index = Number(apiSlice.window_index);
    this.start_time = Number(apiSlice.start_time);
    this.end_time = Number(apiSlice.end_time);
    SPECIES.forEach((species) => {
      this[species.key] = Boolean(apiSlice[species.key]);
    });
  }
}

export default class AnnotationReportResponse {
  constructor(apiResponse = {}) {
    this.afid = Number(apiResponse.afid);
    this.source = apiResponse.source ?? 'None';
    this.report_id = apiResponse.report_id ?? null;
    this.saved_at = apiResponse.saved_at ?? null;
    this.warnings = Array.isArray(apiResponse.warnings)
      ? [...apiResponse.warnings]
      : [];
    this.slices = Array.isArray(apiResponse.slices)
      ? apiResponse.slices.map((slice) => new AnnotationSliceReport(slice))
      : [];
  }

  get length() {
    return this.slices.length;
  }

  map(callback) {
    return this.slices.map(callback);
  }

  toArray() {
    return [...this.slices];
  }
}
