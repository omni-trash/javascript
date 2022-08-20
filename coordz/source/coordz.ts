/// <amd-module name="coordz"/>

/*!
 * Geographische Koordinaten
 * v1.22.8.16
 **/

/* eslint no-fallthrough: 0 */
/* eslint no-inner-declarations: 0 */
/* eslint no-useless-escape: 0 */

/* eslint @typescript-eslint/no-namespace: 0 */
/* eslint @typescript-eslint/prefer-namespace-keyword: 0 */
/* eslint @typescript-eslint/no-inferrable-types: 0 */
/* eslint @typescript-eslint/no-explicit-any: 0 */

export module Coordz {

    export enum DataType {
        Latitude    = 'Latitude',
        Longitude   = 'Longitude',
        Unspecified = 'Unspecified'
    }

    export interface IData {
        /** unsigned degrees part */
        d: number,

        /** unsigned minutes part */
        m: number,

        /** unisgned seconds part */
        s: number,

        /** unsigned integer full */
        n: number,

        /** signed degrees full */
        D: number,

        /** signed minutes full */
        M: number,

        /** signed seconds full */
        S: number,

        /** singed integer full */
        N: number,

        /** cardinal point "N|E|S|W" */
        H: string,

        /** Latitude|Longitude|Unspecified */
        T: DataType,

        /** convert to latitude */
        lat: () => IData,

        /** convert to longitude */
        lon: () => IData,

        /** render value */
        render: (format?: string)=> string
    }

    enum TokenType{
        Degree   = 'Degree',
        Minute   = 'Minute' ,
        Second   = 'Second',
        Number   = 'Number',
        Cardinal = 'Cardinal',
        Flush    = 'Flush',
        Trash    = 'Trash'
    }

    interface IToken {
        // Type
        T: TokenType,
        // Value
        V: string
    }

    interface IBag {
        // degree
        D: string[],
        // minute
        M: string[],
        // second
        S: string[],
        // unspecific
        X: string[],
        // cardinal point
        H: string[]
    }

    // Prime
    const SIGN_DEGREE: string = '°';
    const SIGN_MINUTE: string = "'";
    const SIGN_SECOND: string = '"';

    // Variant
    const SIGN_MINUTE_VARIANT = [
        '\u2032',   // prime
        '\u2035',   // reversed prime
        '\u02B9'    // modifier letter prime
    ];

    // Variant
    const SIGN_SECOND_VARIANT = [
        '\u2033',   // double prime
        '\u2036',   // reversed double prime
        '\u02BA',   // modifier letter double prime
        "''"        // 2x'
    ];

    /**
     * some common format strings for render
     */
    export const Format = {
        Default : "dd°mm'ss.s\"H",
        Degrees : "D.ddddd°",
        Minutes : "M.mmmmm'",
        Seconds : "S.sssss\""
    } as const;

    const zeroes: number[] = [-0, +0, Number.NaN, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];

    const math = {
        // abs(-12.345) -> 12.345
        abs: function(number: number): number {
            // for now lets say these values are 0 to prevent unexpected formatting (string)
            for (const val of zeroes) {
                if (number === val) {
                    return 0;
                }
            }

            return (number < 0 ? -number : number);
        },
        // fract(-12.345) -> -0.3450000
        fract: function(number: number): number {
            return math.float((number % 1).toPrecision(7));
        },
        // trunc(-12.345, 2) -> -12.34
        trunc: function(number: number, deci: number): number {
            let   n: number = math.int(number);
            const f: number = math.fract(number);
            const p: number = Math.pow(10, deci);

            if (p > 1) {
                n = n + math.int(f * p) / p;
            }

            return n;
        },
        // round away from zero    
        // round(-20.5) -> -21
        // round(52.033277777777776, 7) -> 52.0332778
        round: function (number: number, deci: number = 0): number {
            const p: number = Math.pow(10, deci);
            let   x: number = (number < 0 ? -0.5 : 0.5);

            if (p > 1) {
                x = x / p;
            }

            return math.trunc(number + x, deci);
        },
        // int32 (!)
        // int(-12.345) -> -12
        int: function(number: any): number {
            return number >> 0;
        },
        // float(NaN) -> 0
        float: function(number: any): number {
            return parseFloat(number) || 0;
        }
    };

    /**
     * D, M, S -> N = [-]ddddmmsss = int32
     * @param D Degrees
     * @param M Minutes
     * @param S Seconds
     * @returns N
     */
    export function combine(D: number, M: number, S: number): number {
        D = D || 0;
        M = M || 0;
        S = S || 0;

        // total seconds
        const degrees = D;
        const minutes = (M + math.abs(degrees * 60)) * (degrees < 0 ? -1 : 1);
        const seconds = (S + math.abs(minutes * 60)) * (minutes < 0 ? -1 : 1);
        let   total   = math.int(math.round(seconds * 10));

        const s = total % 600;
        total = (total - s) / 600;

        const m = total % 60;
        total = (total - m) / 60;

        const d = total % 180;
        const N = (d * 100 + m) * 1000 + s;

        return N;

/*
        // total degrees
        var total: number = D;

        // add minutes to total degrees
        total = (total < 0 ? -1 : 1) * (math.abs(total) + (M / 60));

        // add seconds to total degrees
        total = (total < 0 ? -1 : 1) * (math.abs(total) + (S / 3600));

        // down (60) for compatibility
        while (math.abs(total) >= 180) {
            total = total / 60;
        }

        var N: number = total;

        // up (100)
        N = math.int(N) * 100 + math.round(math.fract(N) * 60, 5);
        N = math.int(N) * 100 + math.round(math.fract(N) * 60, 5);
        // ddmmss.s -> ddmmsss
        N = N * 10;

        // Math.round(-20.5) -> 20!
        // math.round(-20.5) -> 21!
        // round away from zero
        N = math.round(N);

        return N;
*/
    }

    /**
     * N = [-]ddddmmsss = int32 -> {D, M, S ...}
     * @param N 
     * @returns IData
     */
    export function data(N: number): IData {
        N = math.int(N);

        const n: number = math.abs(N);
        let   d: number = math.int(n / 100000);
        let   m: number = math.int(n % 100000 / 1000);
        let   s: number = math.int(n % 1000);

        s = s / 10;
        m = m + s / 60;
        d = d + m / 60;

        const D = (N < 0 ? -d : d);
        const M = (D * 60);
        const S = (M * 60);

        // round floats not required but looks better
        const coord: IData = {
            d: math.round(d, 7),
            m: math.round(m, 7),
            s: math.round(s, 7),
            n: n,
            D: math.round(D, 7),
            M: math.round(M, 7),
            S: math.round(S, 7),
            N: N,
            H: '',
            T: DataType.Unspecified,
            lat: () => lat(coord),
            lon: () => lon(coord),
            render: (format?: string) => render(format, coord)
        };

        return coord;
    }

    /**
     * parse string to [{D, M, S ...}, ...]
     * @param value 
     * @returns IData[]
     */
    export function parse(value: string): IData[] {
        // tokenize (and normalize some parts)
        const tokens: IToken[] = tokenize(value || "");

        // analyze and organize for processing
        const organized: IToken[] = organize(tokens);

        // make data array
        return process(organized);
    }

    /**
     * split string into parts
     * @param value 
     * @returns IToken[]
     */
    function tokenize(value: string): IToken[] {
        // TRASH   : unspecific
        // NUMBER  : '-d.d°'
        // CARDINAL: 'ABC'
        // FLUSH   : ','
        const regex = /([-+]?[0-9]+([\.,][0-9]+)?)([^-+0-9\.,;a-z]*)|([a-z]+)|([,;])/ig;

        // error correction for correct match: "0,0.555" -> "0, 0.555"
        value = value.replace(/[0-9],[0-9]+\.[0-9]/g, (a) => a.replace(",", ", "));

        // parts
        const match: string[] = value.match(regex) || [value];

        const tokens: IToken[] = match.map(item => {
            const token = {T: TokenType.Trash, V: item.trim()};

            if (/[0-9]/.test(token.V)) {
                // accept decimal comma
                // "12,3" -> "12.3"
                token.V = token.V.replace(',', '.');

                // seconds first, we allow to use 2x' as seconds
                SIGN_SECOND_VARIANT.forEach(variant => {
                    token.V = token.V.replace(variant, SIGN_SECOND);
                });

                SIGN_MINUTE_VARIANT.forEach(variant => {
                    token.V = token.V.replace(variant, SIGN_MINUTE);
                });

                if (token.V.indexOf(SIGN_DEGREE) > -1) {
                    token.T = TokenType.Degree;
                } else if (token.V.indexOf(SIGN_MINUTE) > -1) {
                    token.T = TokenType.Minute;
                } else if (token.V.indexOf(SIGN_SECOND) > -1) {
                    token.T = TokenType.Second;
                } else {
                    token.T = TokenType.Number;
                }
            } else if (/[a-z]/i.test(token.V)) {
                token.V = token.V.toUpperCase();
                token.T = TokenType.Cardinal;
            } else if (',;'.indexOf(token.V) > -1) {
                token.T = TokenType.Flush;
            }

            return token;
        });

        return tokens;
    }

    /**
     * analyze and organize for processing
     * @param tokens 
     * @returns IToken[]
     */
    function organize(tokens: IToken[]): IToken[] {
        const organized: IToken[] = [];
        let   numbers:   number   = 0;
        let   hist:      any      = {};
        let   last:      IToken | null;

        // reset stats
        const reset = () => {
            numbers  = 0;
            hist     = {};
            last     = null;
        };

        // append TokenType.Flush
        const flush = (V?: string) => {
            if (last && last.T != TokenType.Flush) {
                const token: IToken = {T: TokenType.Flush, V: V || 'auto'};
                organized.push(token);
                last = token;
            }
        }

        for (const token of tokens) {
            switch (token.T) {
                case TokenType.Cardinal:
                    // 1 2 3 N E ...
                    // N 1 2 3 E ...
                    if (hist[token.T]) {
                        flush();
                        reset();
                    }

                    organized.push(token);
                    hist[token.T] = 1;

                    // 1 2 3 N ...
                    if (numbers) {
                        flush();
                        reset();
                    }

                    break;
                case TokenType.Degree:
                case TokenType.Minute:
                case TokenType.Second:
                    // 1° 2' 3" 1° ...
                    if (hist[token.T]) {
                        flush();
                        reset();
                    }
                    // dont break!
                case TokenType.Number:
                    // 1 2 3 1 ...
                    if (numbers == 3) {
                        flush();
                        reset();
                    }

                    organized.push(token);
                    hist[token.T] = 1;

                    ++numbers;
                    break;
                case TokenType.Flush:
                    // 1 , 2
                    flush(token.V);
                    reset();
                    break;
            }

            last = organized[organized.length - 1];
        }

        flush();

        return organized;    
    }

    /**
     * make data array
     * @param organized 
     * @returns IData[]
     */
    function process(organized: IToken[]): IData[] {
        const result: IData[] = [];

        // hold DMS or X for unspecific numbers, H for cardinal points
        const bag: IBag = {D: [], M: [], S: [], X: [], H: []};

        for (const token of organized) {
            switch (token.T) {
                case TokenType.Cardinal:
                    bag.H.push(token.V);
                    break;
                case TokenType.Degree:
                    bag.D.push(token.V);
                    break;
                case TokenType.Minute:
                    bag.M.push(token.V);
                    break;
                case TokenType.Second:
                    bag.S.push(token.V);
                    break;
                case TokenType.Number:
                    bag.X.push(token.V);
                    break;
                case TokenType.Flush:
                    flush(bag, result);
                    break;
            }
        }

        return result;
    }

    /**
     * flush bag
     * @param bag 
     * @param result
     */
    function flush(bag: IBag, result: IData[]) {
        // while has numbers
        while (bag.D.length || bag.M.length || bag.S.length || bag.X.length) {
            const D = math.float(bag.D.length > 0 ? bag.D.shift() : bag.X.shift());
            const M = math.float(bag.M.length > 0 ? bag.M.shift() : bag.X.shift());
            const S = math.float(bag.S.length > 0 ? bag.S.shift() : bag.X.shift());
            let   H = bag.H.shift() || '';
            let   T = DataType.Unspecified;
            let   N = combine(D, M, S);

            switch (H) {
                case 'S':
                    N = -N;
                case 'N':
                    H = (N < 0 ? 'S' : 'N');
                    T = DataType.Latitude;
                    break;
                case 'W':
                    N = -N;
                case 'E':
                    H = (N < 0 ? 'W' : 'E');
                    T = DataType.Longitude;
                    break;
            }

            // data(N) converts to DataType.Unspecified
            const item = data(N);

            // apply type and cardinal
            item.H = H;
            item.T = T;

            result.push(item);
        }

        // clean bag
        bag.H = [];
    }

    /**
     * convert to latitude
     * @param data 
     * @returns data
     */
    function lat(data: IData) {
        data.H = (data.N < 0 ? 'S' : 'N');
        data.T = DataType.Latitude;
        return data;
    }

    /**
     * convert to longitude
     * @param data 
     * @returns data
     */
    function lon(data: IData) {
        data.H = (data.N < 0 ? 'W' : 'E');
        data.T = DataType.Longitude;
        return data;
    }

    /**
     * render single value
     * render("DD°mm'ss.s\"", data(1122334)) -> 11°22'33.4"
     * @param format 
     * @param data 
     * @returns string
     */
    export function render(format: string = Format.Default, data: IData): string {
        let text: string = format;

        text = text.replace(/((?<x>[dmsn])\k<x>*)(\.(\k<x>+))?/ig, function(a, b, c, d, e) {
            // ((x)xxxx)(.(xxxx))
            //   c         eeee
            //   bbbbbb  dddddd 

            const digit = b.length;
            const deci  = e && e.length || 0;
            const len   = digit + (d && d.length || 0);
            let   val   = 0;

            switch (c) {
                case "d":
                    val = data.d;
                    break;
                case "m":
                    val = data.m;
                    break;
                case "s":
                    val = data.s;
                    break;

                case "D":
                    val = data.D;
                    break;
                case "M":
                    val = data.M;
                    break;
                case "S":
                    val = data.S;
                    break;

                case "n":
                    val = data.n;
                    break;
                case "N":
                    val = data.N;
                    break;
            }

            // needed for some rarely special cases, for example D = -0.001 ("D" -> "-0")
            const sign: string = (val < 0 ? "-" : "");
            return sign + math.abs(math.trunc(val, deci)).toFixed(deci).padStart(len, "0");
        });

        text = text.replace(/H+/ig, data.H || '?');

        return text;
    }
}
