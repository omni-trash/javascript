/*!
 * Geographische Koordinaten
 * v1.22.6.26
 **/
var Coordz;
(function (Coordz) {
    var DataType;
    (function (DataType) {
        DataType["Latitude"] = "Latitude";
        DataType["Longitude"] = "Longitude";
        DataType["Unspecified"] = "Unspecified";
    })(DataType = Coordz.DataType || (Coordz.DataType = {}));
    var TokenType;
    (function (TokenType) {
        TokenType["Degree"] = "Degree";
        TokenType["Minute"] = "Minute";
        TokenType["Second"] = "Second";
        TokenType["Number"] = "Number";
        TokenType["Cardinal"] = "Cardinal";
        TokenType["Flush"] = "Flush";
        TokenType["Trash"] = "Trash";
    })(TokenType || (TokenType = {}));
    var SIGN_DEGREE = '°';
    var SIGN_MINUTE = "'";
    var SIGN_SECOND = '"';
    var SIGN_MINUTE_VARIANT = [
        '\u2032',
        '\u2035',
        '\u02B9'
    ];
    var SIGN_SECOND_VARIANT = [
        '\u2033',
        '\u2036',
        '\u02BA',
        "''"
    ];
    Coordz.Format = {
        Default: "dd°mm'ss.s\"H",
        Degrees: "D.ddddd°",
        Minutes: "M.mmmmm'",
        Seconds: "S.sssss\""
    };
    var zeroes = [-0, +0, Number.NaN, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
    var math = {
        abs: function (number) {
            for (var _i = 0, zeroes_1 = zeroes; _i < zeroes_1.length; _i++) {
                var val = zeroes_1[_i];
                if (number === val) {
                    return 0;
                }
            }
            return (number < 0 ? -number : number);
        },
        fract: function (number) {
            return math.float((number % 1).toPrecision(7));
        },
        trunc: function (number, deci) {
            var n = math.int(number);
            var f = math.fract(number);
            var p = Math.pow(10, deci);
            if (p > 1) {
                n = n + math.int(f * p) / p;
            }
            return n;
        },
        round: function (number, deci) {
            if (deci === void 0) { deci = 0; }
            var p = Math.pow(10, deci);
            var x = (number < 0 ? -0.5 : 0.5);
            if (p > 1) {
                x = x / p;
            }
            return math.trunc(number + x, deci);
        },
        int: function (number) {
            return number >> 0;
        },
        float: function (number) {
            return parseFloat(number) || 0;
        }
    };
    function combine(D, M, S) {
        D = D || 0;
        M = M || 0;
        S = S || 0;
        var degrees = D;
        var minutes = (M + math.abs(degrees * 60)) * (degrees < 0 ? -1 : 1);
        var seconds = (S + math.abs(minutes * 60)) * (minutes < 0 ? -1 : 1);
        var total = math.int(math.round(seconds * 10));
        var s = total % 600;
        total = (total - s) / 600;
        var m = total % 60;
        total = (total - m) / 60;
        var d = total % 180;
        var N = (d * 100 + m) * 1000 + s;
        return N;
    }
    Coordz.combine = combine;
    function data(N) {
        N = math.int(N);
        var n = math.abs(N);
        var d = math.int(n / 100000);
        var m = math.int(n % 100000 / 1000);
        var s = math.int(n % 1000);
        s = s / 10;
        m = m + s / 60;
        d = d + m / 60;
        var D = (N < 0 ? -d : d);
        var M = (D * 60);
        var S = (M * 60);
        var coord = {
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
            lat: function () { return lat(coord); },
            lon: function () { return lon(coord); },
            render: function (format) { return render(format, coord); }
        };
        return coord;
    }
    Coordz.data = data;
    function parse(value) {
        var tokens = tokenize(value || "");
        var organized = organize(tokens);
        return process(organized);
    }
    Coordz.parse = parse;
    function tokenize(value) {
        var regex = /([-+]?[0-9]+([\.,][0-9]+)?)([^-+0-9\.,;a-z]*)|([a-z]+)|([,;])/ig;
        value = value.replace(/[0-9],[0-9]+\.[0-9]/g, function (a) { return a.replace(",", ", "); });
        var match = value.match(regex) || [value];
        var tokens = match.map(function (item) {
            var token = { T: TokenType.Trash, V: item.trim() };
            if (/[0-9]/.test(token.V)) {
                token.V = token.V.replace(',', '.');
                SIGN_SECOND_VARIANT.forEach(function (variant) {
                    token.V = token.V.replace(variant, SIGN_SECOND);
                });
                SIGN_MINUTE_VARIANT.forEach(function (variant) {
                    token.V = token.V.replace(variant, SIGN_MINUTE);
                });
                if (token.V.indexOf(SIGN_DEGREE) > -1) {
                    token.T = TokenType.Degree;
                }
                else if (token.V.indexOf(SIGN_MINUTE) > -1) {
                    token.T = TokenType.Minute;
                }
                else if (token.V.indexOf(SIGN_SECOND) > -1) {
                    token.T = TokenType.Second;
                }
                else {
                    token.T = TokenType.Number;
                }
            }
            else if (/[a-z]/i.test(token.V)) {
                token.V = token.V.toUpperCase();
                token.T = TokenType.Cardinal;
            }
            else if (',;'.indexOf(token.V) > -1) {
                token.T = TokenType.Flush;
            }
            return token;
        });
        return tokens;
    }
    function organize(tokens) {
        var organized = [];
        var numbers = 0;
        var hist = {};
        var last;
        var reset = function () {
            numbers = 0;
            hist = {};
            last = null;
        };
        var flush = function (V) {
            if (last && last.T != TokenType.Flush) {
                var token = { T: TokenType.Flush, V: V || 'auto' };
                organized.push(token);
                last = token;
            }
        };
        for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
            var token = tokens_1[_i];
            switch (token.T) {
                case TokenType.Cardinal:
                    if (hist[token.T]) {
                        flush();
                        reset();
                    }
                    organized.push(token);
                    hist[token.T] = 1;
                    if (numbers) {
                        flush();
                        reset();
                    }
                    break;
                case TokenType.Degree:
                case TokenType.Minute:
                case TokenType.Second:
                    if (hist[token.T]) {
                        flush();
                        reset();
                    }
                case TokenType.Number:
                    if (numbers == 3) {
                        flush();
                        reset();
                    }
                    organized.push(token);
                    hist[token.T] = 1;
                    ++numbers;
                    break;
                case TokenType.Flush:
                    flush(token.V);
                    reset();
                    break;
            }
            last = organized[organized.length - 1];
        }
        flush();
        return organized;
    }
    function process(organized) {
        var result = [];
        var bag = { D: [], M: [], S: [], X: [], H: [] };
        for (var _i = 0, organized_1 = organized; _i < organized_1.length; _i++) {
            var token = organized_1[_i];
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
    function flush(bag, result) {
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
            var item = data(N);
            item.H = H;
            item.T = T;
            result.push(item);
        }
        bag.H = [];
    }
    function lat(data) {
        data.H = (data.N < 0 ? 'S' : 'N');
        data.T = DataType.Latitude;
        return data;
    }
    function lon(data) {
        data.H = (data.N < 0 ? 'W' : 'E');
        data.T = DataType.Longitude;
        return data;
    }
    function render(format, data) {
        if (format === void 0) { format = Coordz.Format.Default; }
        var text = format;
        text = text.replace(/((?<x>[dmsn])\k<x>*)(\.(\k<x>+))?/ig, function (a, b, c, d, e) {
            var digit = b.length;
            var deci = e && e.length || 0;
            var len = digit + (d && d.length || 0);
            var val = 0;
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
            var sign = (val < 0 ? "-" : "");
            return sign + math.abs(math.trunc(val, deci)).toFixed(deci).padStart(len, "0");
        });
        text = text.replace(/H+/ig, data.H || '?');
        return text;
    }
    Coordz.render = render;
})(Coordz || (Coordz = {}));
//# sourceMappingURL=coordz.js.map