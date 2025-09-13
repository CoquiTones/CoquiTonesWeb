
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
        this.date_bin = APIResponse.date_bin; // what is this
    }
}