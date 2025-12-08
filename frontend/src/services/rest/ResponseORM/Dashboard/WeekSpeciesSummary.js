
/**
 *  Encapsulation of expected reponse of endpoint 
 *
 * @export
 * @class WeekSpeciesSummary
 * @typedef {WeekSpeciesSummary}
 */
export class WeekSpeciesSummary {
    total_coqui;
    total_wightmanae;
    total_gryllus;
    total_portoricensis;
    total_unicolor;
    total_hedricki;
    total_locustus;
    total_richmondi;
    date_bin = [];

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
                label: "Coqui"
            },
            {
                data: this.total_wightmanae,
                label: "Wightmanae"
            },
            {
                data: this.total_gryllus,
                label: "Gryllus"
            },
            {
                data: this.total_portoricensis,
                label: "Portoricensis"
            },
            {
                data: this.total_unicolor,
                label: "Unicolor"
            },
            {
                data: this.total_hedricki,
                label: "Hedricki"
            },
            {
                data: this.total_locustus,
                label: "Locustus"
            },
            {
                data: this.total_richmondi,
                label: "Richmondi"
            }
        ]

        return series;
    }

    isEmpty() {
        return this.date_bin == undefined ? true : false;
    }
}