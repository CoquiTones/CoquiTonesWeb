import { SPECIES } from '../../../../components/classifier/species.js';

const toApiSlice = (slice, index) => {
  const result = {
    window_index: Number(slice?.window_index ?? index),
    start_time: Number(slice?.start_time ?? slice?.start),
    end_time: Number(slice?.end_time ?? slice?.end),
  };
  SPECIES.forEach((species) => {
    result[species.key] = Boolean(slice?.[species.key]);
  });
  return result;
};

export default class SaveAnnotationReportRequest {
  constructor({
    afid,
    baseReportId = null,
    overwrite = false,
    slices = [],
  } = {}) {
    this.afid = afid;
    this.baseReportId = baseReportId;
    this.overwrite = overwrite;
    this.slices = slices;
  }

  toJSON() {
    return {
      afid: Number(this.afid),
      base_report_id: this.baseReportId === null || this.baseReportId === undefined
        ? null
        : Number(this.baseReportId),
      overwrite: Boolean(this.overwrite),
      slices: this.slices.map(toApiSlice),
    };
  }
}
