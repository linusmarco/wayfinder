export default class Helpers {
    static wait(ms) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }

    static hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? [
                  parseInt(result[1], 16),
                  parseInt(result[2], 16),
                  parseInt(result[3], 16)
              ]
            : null;
    }

    static getUrlParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    static urlEncodeObj(obj) {
        return btoa(JSON.stringify(obj))
            .replace(/\+/, '.')
            .replace(/\//, '_')
            .replace(/=/, '-');
    }

    static urlDecodeObj(encoded) {
        return JSON.parse(
            atob(
                encoded
                    .replace(/\./, '+')
                    .replace(/_/, '/')
                    .replace(/-/, '=')
            )
        );
    }
}
