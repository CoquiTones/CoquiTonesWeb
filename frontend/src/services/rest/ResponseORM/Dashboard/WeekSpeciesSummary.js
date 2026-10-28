import { parseApiDate } from '../../../../utils/format';

/**
 * Encapsulation of the `/api/dashboard/week-species-summary` response.
 */
export class WeekSpeciesSummary {
  static SERIES = [
    ['total_coqui', 'Coquí'],
    ['total_wightmanae', 'Wightmanae'],
    ['total_gryllus', 'Gryllus'],
    ['total_portoricensis', 'Portoricensis'],
    ['total_unicolor', 'Unicolor'],
    ['total_hedricki', 'Hedricki'],
    ['total_locustus', 'Locustus'],
    ['total_richmondi', 'Richmondi'],
  ];

  constructor(APIResponse = {}) {
    this.total_coqui = APIResponse.total_coqui ?? [];
    this.total_wightmanae = APIResponse.total_wightmanae ?? [];
    this.total_gryllus = APIResponse.total_gryllus ?? [];
    this.total_portoricensis = APIResponse.total_portoricensis ?? [];
    this.total_unicolor = APIResponse.total_unicolor ?? [];
    this.total_hedricki = APIResponse.total_hedricki ?? [];
    this.total_locustus = APIResponse.total_locustus ?? [];
    this.total_richmondi = APIResponse.total_richmondi ?? [];
    this.date_bin = APIResponse.date_bin ?? [];
  }

  getXData() {
    return this.date_bin.map((date) =>
      parseApiDate(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    );
  }

  getSeriesData() {
    return WeekSpeciesSummary.SERIES.map(([key, label]) => ({
      data: this[key] ?? [],
      label,
      valueFormatter: (value) => (value == null ? '—' : `${value} detected`),
    }));
  }

  isEmpty() {
    return !Array.isArray(this.date_bin) || this.date_bin.length === 0;
  }
}

export default WeekSpeciesSummary;
