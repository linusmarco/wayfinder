import hlp from './Helpers';

export default class DataService {
    constructor() {}

    async getData(params) {
        const encoded = btoa(JSON.stringify(params));
        let initResp = await this.get('/api/init', encoded);
        initResp = JSON.parse(initResp.responseText);

        if (!initResp.wait) {
            return initResp;
        } else {
            return JSON.parse(await this.poll(`${initResp.S3Key}-walked`));
        }
    }

    async poll(key) {
        let pollResp = {};
        while (pollResp.status !== 200) {
            await hlp.wait(10000);
            pollResp = await this.get('/api/poll', key);
        }

        return pollResp.responseText;
    }

    get(url, data) {
        return new Promise((resolve, reject) => {
            let oReq = new XMLHttpRequest();
            oReq.addEventListener('load', function() {
                resolve(this);
            });

            oReq.open('GET', `${url}?d=${data}`, true);
            oReq.send();
        });
    }
}
