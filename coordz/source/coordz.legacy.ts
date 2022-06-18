/// <amd-module name="coordz"/>

/*!
 * Geographische Koordinaten
 * v1.22.6.12
 **/

module Coordz {

    export enum DataType {
        Latitude    = 'Latitude',
        Longitude   = 'Longitude',
        Unspecified = 'Unspecified'
    }

    export interface IData {
        // unsigned degrees part
        d: number,

        // unsigned minutes part
        m: number,

        // unisgned seconds part
        s: number,

        // unsigned integer full
        n: number,

        // signed degrees full
        D: number,

        // signed minutes full
        M: number,

        // signed seconds full
        S: number,

        // singed integer full
        N: number,

        // cardinal point "N|E|S|W"
        H: string,

        // "Latitude|Longitude|Unspecified"
        T: DataType,

        // convert to latitude
        lat: () => IData,

        // convert to longitude
        lon: () => IData,

        // render value
        render: (format: string)=> string
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

    // some common format strings for render
    export const Format = {
        Default : "dd°mm'ss.s\"H",
        Degrees : "D.ddddd°",
        Minutes : "M.mmmmm'",
        Seconds : "S.sssss\""
    } as const;

    var math = {
        // abs(-12.345) -> 12.345
        abs: function(number: number): number {
            return (number < 0 ? -number : number);
        },
        // fract(-12.345) -> -0.3450000
        fract: function(number: number): number {
            return math.float((number % 1).toPrecision(7));
        },
        // trunc(-12.345, 2) -> -12.34
        trunc: function(number: number, deci: number): number {
            var n: number = math.int(number);
            var f: number = math.fract(number);
            var p: number = Math.pow(10, deci);

            if (p > 1) {
                n = n + math.int(f * p) / p;
            }

            return n;
        },
        // round away from zero    
        // round(-20.5) -> -21
        // round(52.033277777777776, 7) -> 52.0332778
        round: function (number: number, deci: number = 0): number {
            var p: number = Math.pow(10, deci);
            var x: number = (number < 0 ? -0.5 : 0.5);

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

    // D, M, S -> N = [-]ddddmmsss = int32
    export function combine(D: number, M: number, S: number): number {
        D = D || 0;
        M = M || 0;
        S = S || 0;

        var d: number = math.abs(D) + ((M + (S / 60)) / 60);

        // down (60)
        while (d >= 180) {
            d = d / 60;
        }

        // up (100)
        d = math.int(d) * 100 + math.fract(d) * 60;
        d = math.int(d) * 100 + math.fract(d) * 60;
        // ddmmss.s -> ddmmsss
        d = d * 10;

        // Math.round(-20.5) -> 20!
        // math.round(-20.5) -> 21!
        // round away from zero
        d = math.round(d);

        var n = math.int(d);
        var N = (D < 0 ? -n : n);

        return N;
    }

    // N = [-]ddddmmsss = int32 -> {D, M, S ...}
    export function data(N: number): IData {
        N = math.int(N);

        var n: number = math.abs(N);
        var d: number = math.int(n / 100000);
        var m: number = math.int(n % 100000 / 1000);
        var s: number = math.int(n % 1000);

        s = s / 10;
        m = m + s / 60;
        d = d + m / 60;

        var D = (N < 0 ? -d : d);
        var M = (D * 60);
        var S = (M * 60);

        // round floats not required but looks better
        var coord: IData = {
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
            render: (format: string) => render(format, coord)
        };

        return coord;
    }

    // parse string to [{D, M, S ...}, ...]
    export function parse(value: string): IData[] {
        // tokenize (and normalize some parts)
        var tokens: IToken[] = tokenize(value || "");

        // analyze and organize for processing
        var organized: IToken[] = organize(tokens);

        // make data array
        return process(organized);
    }

    // split string into parts
    function tokenize(value: string): IToken[] {
        // TRASH   : unspecific
        // NUMBER  : '-d.d°'
        // CARDINAL: 'ABC'
        // FLUSH   : ','
        var regex = /([-+]?[0-9]+([\.,][0-9]+)?)([^-+0-9\.,;a-z]*)|([a-z]+)|([,;])/ig;

        // error correction for correct match: "0,0.555" -> "0, 0.555"
        value = value.replace(/[0-9],[0-9]+\.[0-9]/g, (a) => a.replace(",", ", "));

        // parts
        var match: string[] = value.match(regex) || [value];

        var tokens: IToken[] = match.map(item => {
            var token = {T: TokenType.Trash, V: item.trim()};

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

    // analyze and organize for processing
    function organize(tokens: IToken[]): IToken[] {
        var organized: IToken[] = [];
        var numbers:   number   = 0;
        var hist:      object   = {};
        var last:      IToken | null;

        // reset stats
        var reset = () => {
            numbers  = 0;
            hist     = {};
            last     = null;
        };

        // append TokenType.Flush
        var flush = (V?: string) => {
            if (last && last.T != TokenType.Flush) {
                var token: IToken = {T: TokenType.Flush, V: V || 'auto'};
                organized.push(token);
                last = token;
            }
        }

        for (var token of tokens) {
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

    // make data array
    function process(organized: IToken[]): IData[] {
        var result: IData[] = [];

        // hold DMS or X for unspecific numbers, H for cardinal points
        var bag: IBag = {D: [], M: [], S: [], X: [], H: []};

        for (var token of organized) {
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

    // flush bag
    function flush(bag: IBag, result: IData[]) {
        // while has numbers
        while (bag.D.length || bag.M.length || bag.S.length || bag.X.length) {
            var D = math.float(bag.D.length > 0 ? bag.D.shift() : bag.X.shift());
            var M = math.float(bag.M.length > 0 ? bag.M.shift() : bag.X.shift());
            var S = math.float(bag.S.length > 0 ? bag.S.shift() : bag.X.shift());
            var H = bag.H.shift() || '';
            var T = DataType.Unspecified;
            var N = combine(D, M, S);

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
            var item = data(N);

            // apply type and cardinal
            item.H = H;
            item.T = T;

            result.push(item);
        }

        // clean bag
        bag.H = [];
    }

    // convert to latitude
    function lat(data: IData) {
        data.H = (data.N < 0 ? 'S' : 'N');
        data.T = DataType.Latitude;
        return data;
    }

    // convert to longitude
    function lon(data: IData) {
        data.H = (data.N < 0 ? 'W' : 'E');
        data.T = DataType.Longitude;
        return data;
    }

    // render single value
    // render("DD°mm'ss.s\"", data(1122334)) -> 11°22'33.4"
    export function render(format: string = Format.Default, data: IData): string {
        var text: string = format;

        text = text.replace(/((?<x>[dmsn])\k<x>*)(\.(\k<x>+))?/ig, function(a, b, c, d, e) {
            // ((x)xxxx)(.(xxxx))
            //   c         eeee
            //   bbbbbb  dddddd 

            var digit = b.length;
            var deci  = e && e.length || 0;
            var len   = digit + (d && d.length || 0);
            var val   = 0;

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

            return math.trunc(val, deci).toFixed(deci).padStart(len, "0");
        });

        text = text.replace(/H+/ig, data.H || '?');

        return text;
    }

}
