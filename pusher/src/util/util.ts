export class Util {
    public static padStart(str: string, targetLength: number, padString: string): string {
        // https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
        targetLength = targetLength >> 0; // truncate if number or convert non-number to 0;
        padString = String((typeof padString !== "undefined" ? padString : " "));
        if (str.length > targetLength) {
            return String(str);
        }
        else {
            targetLength = targetLength - str.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length); // append to original to ensure we are longer than needed
            }
            return padString.slice(0, targetLength) + String(str);
        }
    }
}