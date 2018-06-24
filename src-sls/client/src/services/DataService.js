export default class DataService {
    constructor() {}

    get(url, qParams) {
        return new Promise(resolve => {
            let oReq = new XMLHttpRequest();
            oReq.addEventListener('load', function() {
                resolve(this);
            });

            qParams.forEach((p, i) => {
                url += i === 0 ? '?' : '&';
                url += `${p.key}=${p.value}`;
            });

            oReq.open('GET', url, true);
            oReq.send();
        });
    }
}
