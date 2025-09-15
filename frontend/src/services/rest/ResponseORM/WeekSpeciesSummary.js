
/**
 *  Encapsulation of expected reponse of endpoint 
 *
 * @export
 * @class WeekSpeciesSummary
 * @typedef {WeekSpeciesSummary}
 */
export class WeekSpeciesSummary {
    constructor(APIResponse) {
        this.total_coqui = APIResponse.total_coqui;
        this.total_wightmanae = APIResponse.total_wightmanae;
        this.total_gryllus = APIResponse.total_gryllus;
        this.total_portoricensis = APIResponse.total_portoricensis;
        this.total_unicolor = APIResponse.total_unicolor;
        this.total_hedricki = APIResponse.total_hedricki;
        this.total_locustus = APIResponse.total_locustus;
        this.total_richmondi = APIResponse.total_richmondi;
        this.date_bin = APIResponse.date_bin;

    }

    getXData() {
        let xData = this.date_bin.map((date) => (
            new Date(date).toUTCString()
        ))
        return xData;
    }

    getSeriesData() {
        let series = [
            {
                data: this.total_coqui,
                label: "coqui"
            },
            {
                data: this.total_wightmanae,
                label: "wightmanae"
            },
            {
                data: this.total_portoricensis,
                label: "portoricensis"
            },
            {
                data: this.total_unicolor,
                label: "unicolor"
            },
            {
                data: this.total_hedricki,
                label: "hedricki"
            },
            {
                data: this.total_locustus,
                label: "locustus"
            },
            {
                data: this.total_richmondi,
                label: "richmondi"
            }
        ]

        return series;
    }
}