export default class ParameterValidator {
    constructor() {
        this.validated = false;
        this.errors = [];
    }

    valid() {
        return this.validated && this.errors.length === 0;
    }

    validate(params) {
        if (!params) {
            this.errors.push({
                dev: 'params is not defined',
                display: 'Unknown error. Please refresh and try again'
            });
        } else {
            // validation of non-user params
            this.validateNumTicks(params.numTicks);
            this.validateSize(params.size);
            this.validateMetric(params.metric);

            // validation of user params
            this.validateMapArea(params.mapArea);
            if (this.errors.length === 0) {
                this.validateOrigins(params.origins, params.mapArea);
            }
        }

        this.validated = true;
    }

    validateMapArea(mapArea) {
        if (!mapArea) {
            this.errors.push({
                dev: 'params.mapArea is not defined',
                display: 'Unknown error. Please refresh and try again'
            });
        } else {
            if (
                typeof Number(mapArea.n) !== 'number' ||
                mapArea.n > 90 ||
                mapArea.n < -90
            ) {
                this.errors.push({
                    dev: 'params.mapArea.n is not a number',
                    display: 'North map bound must be between -90 and 90'
                });
            }

            if (
                typeof Number(mapArea.s) !== 'number' ||
                mapArea.s > 90 ||
                mapArea.s < -90
            ) {
                this.errors.push({
                    dev: 'params.mapArea.s is not a number',
                    display: 'South map bound must be between -90 and 90'
                });
            }

            if (
                typeof Number(mapArea.e) !== 'number' ||
                mapArea.e > 180 ||
                mapArea.e < -180
            ) {
                this.errors.push({
                    dev: 'params.mapArea.e is not a number',
                    display: 'East map bound must be between -180 and 180'
                });
            }

            if (
                typeof Number(mapArea.w) !== 'number' ||
                mapArea.w > 180 ||
                mapArea.w < -180
            ) {
                this.errors.push({
                    dev: 'params.mapArea.w is not a number',
                    display: 'West map bound must be between -180 and 180'
                });
            }

            if (Number(mapArea.n) <= Number(mapArea.s)) {
                this.errors.push({
                    dev: 'params.mapArea.n less than params.mapArea.s',
                    display:
                        'North map bound must be greater than South map bound'
                });
            }

            if (Number(mapArea.e) <= Number(mapArea.w)) {
                this.errors.push({
                    dev: 'params.mapArea.e less than params.mapArea.w',
                    display:
                        'East map bound must be greater than West map bound'
                });
            }

            if (mapArea.id !== null) {
                this.errors.push({
                    dev: 'params.mapArea.id not null',
                    display: 'Unknown error. Please refresh and try again'
                });
            }
        }
    }

    validateMetric(metric) {
        const validMetrics = ['dist', 'time'];

        if (validMetrics.indexOf(metric) === -1) {
            this.errors.push({
                dev: 'params.metric not in [dist, time]',
                display: 'Unknown error. Please refresh and try again'
            });
        }
    }

    validateOrigins(origins, mapArea) {
        if (origins.constructor !== Array) {
            this.errors.push({
                dev: 'params.origins is not an array',
                display: 'Unknown error. Please refresh and try again'
            });
        } else if (origins.length < 1) {
            this.errors.push({
                dev: 'params.origins has fewer than 1 element',
                display:
                    'Please make sure at least one origin point is set to "show"'
            });
        } else {
            origins.forEach((o, i) => {
                const refName = o.name === '' ? `Origin ${i + 1}` : o.name;

                if (
                    Number(o.lat) > Number(mapArea.n) ||
                    Number(o.lat) < Number(mapArea.s)
                ) {
                    this.errors.push({
                        dev: `origins[${i}].lat not in map bounds`,
                        display: `${refName} Latitude must be within N/S map bounds`
                    });
                }

                if (
                    Number(o.lon) > Number(mapArea.e) ||
                    Number(o.lon) < Number(mapArea.w)
                ) {
                    this.errors.push({
                        dev: `origins[${i}].lon not in map bounds`,
                        display: `${refName} Longitude must be within E/W map bounds`
                    });
                }

                if (o.rgb.constructor !== Array || o.rgb.length !== 3) {
                    this.errors.push({
                        dev: `origins[${i}].rgb not 3-element array`,
                        display: `Unknown error. Please refresh and try again`
                    });
                } else if (!o.rgb.every(c => c >= 0 && c <= 255)) {
                    this.errors.push({
                        dev: `origins[${i}].rgb not valid`,
                        display: `Invalid color for ${refName}. Please re-select`
                    });
                }
            });
        }
    }

    validateNumTicks(numTicks) {
        if (!Number.isInteger(numTicks)) {
            this.errors.push({
                dev: 'params.numTicks is not an integer',
                display: 'Unknown error. Please refresh and try again'
            });
        }
    }

    validateSize(size) {
        if (!size) {
            this.errors.push({
                dev: 'params.size is not defined',
                display: 'Unknown error. Please refresh and try again'
            });
        } else {
            if (typeof size.height !== 'number') {
                this.errors.push({
                    dev: 'params.size.height is not a number',
                    display: 'Unknown error. Please refresh and try again'
                });
            }

            if (typeof size.width !== 'number') {
                this.errors.push({
                    dev: 'params.size.width is not a number',
                    display: 'Unknown error. Please refresh and try again'
                });
            }

            if (!size.margin) {
                this.errors.push({
                    dev: 'params.size is not defined',
                    display: 'Unknown error. Please refresh and try again'
                });
            } else {
                if (!Number.isInteger(size.margin.top)) {
                    this.errors.push({
                        dev: 'params.size.margin.top is not an integer',
                        display: 'Unknown error. Please refresh and try again'
                    });
                }

                if (!Number.isInteger(size.margin.bottom)) {
                    this.errors.push({
                        dev: 'params.size.margin.bottom is not an integer',
                        display: 'Unknown error. Please refresh and try again'
                    });
                }

                if (!Number.isInteger(size.margin.left)) {
                    this.errors.push({
                        dev: 'params.size.margin.left is not an integer',
                        display: 'Unknown error. Please refresh and try again'
                    });
                }

                if (!Number.isInteger(size.margin.right)) {
                    this.errors.push({
                        dev: 'params.size.margin.right is not an integer',
                        display: 'Unknown error. Please refresh and try again'
                    });
                }
            }
        }
    }
}
