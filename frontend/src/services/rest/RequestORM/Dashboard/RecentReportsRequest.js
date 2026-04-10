export default class RecentReportsRequest {
    filters = {
        "low_temp": 0,
        "high_temp": 10000,
        "low_humidity": 0,
        "high_humidity": 10000,
        "low_pressure": 0,
        "high_pressure": 10000,
        "low_coqui": 0,
        "high_coqui": 10000,
        "low_wightmanae": 0,
        "high_wightmanae": 10000,
        "low_gryllus": 0,
        "high_gryllus": 10000,
        "low_portoricensis": 0,
        "high_portoricensis": 10000,
        "low_unicolor": 0,
        "high_unicolor": 10000,
        "low_hedricki": 0,
        "high_hedricki": 10000,
        "low_locustus": 0,
        "high_locustus": 10000,
        "low_richmondi": 0,
        "high_richmondi": 10000,
        "description_filter": "",
        "skip": 0,
        "limit": 10,
        "orderby": 1
    }
    constructor(providedFilters = {}) {
        const allowedKeys = Object.keys(this.filters);
        const filteredProvided = Object.keys(providedFilters).reduce((accumulator, key) => {
            if (allowedKeys.includes(key)) accumulator[key] = providedFilters[key];
            return accumulator;
        }, {});
        this.filters = { ...this.filters, ...filteredProvided };
    }



    toFormData() {
        const formData = new FormData();
        for (const [key, value] of Object.entries(this.filters)) {
            formData.append(key, value);
        }
        return formData;
    }

}