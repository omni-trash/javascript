/**
 * Test combine() functionality
 */

import {Coordz} from '../../source/coordz';

test('combine single 50', () => {
    var N: number;
    var D: number = 50;
    var M: number = 50;
    var S: number = 50;

    // 50°00'00.0"
    N = Coordz.combine(D, 0, 0);
    expect(N).toBe(5000000);

    // 00°50'00.0"
    N = Coordz.combine(0, M, 0);
    expect(N).toBe(50000);

    // 00°00'50.0"
    N = Coordz.combine(0, 0, S);
    expect(N).toBe(500);
})

test('combine single -50', () => {
    var N: number;
    var D: number = -50;
    var M: number = -50;
    var S: number = -50;

    // -50°00'00.0"
    N = Coordz.combine(D, 0, 0);
    expect(N).toBe(-5000000);

    // -00°50'00.0"
    N = Coordz.combine(0, M, 0);
    expect(N).toBe(-50000);

    // -00°00'50.0"
    N = Coordz.combine(0, 0, S);
    expect(N).toBe(-500);
})

test('combine mixed 50 50 50', () => {
    var N: number;
    var D: number = 50;
    var M: number = 50;
    var S: number = 50;

    // 50°50'00.0"
    N = Coordz.combine(D, M, 0);
    expect(N).toBe(5050000);

    // 50°00'50.0"
    N = Coordz.combine(D, 0, S);
    expect(N).toBe(5000500);

    // 00°50'50.0"
    N = Coordz.combine(0, M, S);
    expect(N).toBe(50500);

    // 50°50'50.0"
    N = Coordz.combine(D, M, S);
    expect(N).toBe(5050500);
})

test('combine mixed -50 50 50', () => {
    var N: number;
    var D: number = -50;
    var M: number =  50;
    var S: number =  50;

    // -50°50'00.0"
    N = Coordz.combine(D, M, 0);
    expect(N).toBe(-5050000);

    // -50°00'50.0"
    N = Coordz.combine(D, 0, S);
    expect(N).toBe(-5000500);

    // -50°50'50.0"
    N = Coordz.combine(D, M, S);
    expect(N).toBe(-5050500);
})

test('combine mixed 50 -50 50', () => {
    var N: number;
    var D: number =  50;
    var M: number = -50;
    var S: number =  50;

    // 49°10'00.0"
    N = Coordz.combine(D, M, 0);
    expect(N).toBe(4910000);

    // -00°50'50.0"
    N = Coordz.combine(0, M, S);
    expect(N).toBe(-50500);

    // 49°10'50.0"
    N = Coordz.combine(D, M, S);
    expect(N).toBe(4910500);
})

test('combine mixed 50 50 -50', () => {
    var N: number;
    var D: number =  50;
    var M: number =  50;
    var S: number = -50;

    // 49°59'10.0"
    N = Coordz.combine(D, 0, S);
    expect(N).toBe(4959100);

    // 00°49'10.0"
    N = Coordz.combine(0, M, S);
    expect(N).toBe(49100);

    // 50°49'10.0"
    N = Coordz.combine(D, M, S);
    expect(N).toBe(5049100);
})

test('combine mixed 50 -50 -50', () => {
    var N: number;
    var D: number =  50;
    var M: number = -50;
    var S: number = -50;

    // -00°49'10.0"
    N = Coordz.combine(0, M, S);
    expect(N).toBe(-49100);

    // 49°09'10.0"
    N = Coordz.combine(D, M, S);
    expect(N).toBe(4909100);
})

test('combine mixed -50 50 -50', () => {
    var N: number;
    var D: number = -50;
    var M: number =  50;
    var S: number = -50;

    // -49°59'10.0"
    N = Coordz.combine(D, 0, S);
    expect(N).toBe(-4959100);

    // 00°49'10.0"
    N = Coordz.combine(0, M, S);
    expect(N).toBe(49100);

    // -50°49'10.0"
    N = Coordz.combine(D, M, S);
    expect(N).toBe(-5049100);
})

test('combine mixed -50 -50 -50', () => {
    var N: number;
    var D: number = -50;
    var M: number = -50;
    var S: number = -50;

    // -49°10'00.0"
    N = Coordz.combine(D, M, 0);
    expect(N).toBe(-4910000);

    // -49°09'10.0"
    N = Coordz.combine(D, M, S);
    expect(N).toBe(-4909100);
})

test('combine overflow 80', () => {
    var N: number;
    var D: number = 80;
    var M: number = 80;
    var S: number = 80;

    // 80°00'00.0"
    N = Coordz.combine(D, 0, 0);
    expect(N).toBe(8000000);

    // 01°20'00.0"
    N = Coordz.combine(0, M, 0);
    expect(N).toBe(120000);

    // 00°01'20.0"
    N = Coordz.combine(0, 0, S);
    expect(N).toBe(1200);
})

test('combine overflow -80', () => {
    var N: number;
    var D: number = -80;
    var M: number = -80;
    var S: number = -80;

    // -80°00'00.0"
    N = Coordz.combine(D, 0, 0);
    expect(N).toBe(-8000000);

    // -01°20'00.0"
    N = Coordz.combine(0, M, 0);
    expect(N).toBe(-120000);

    // -00°01'20.0"
    N = Coordz.combine(0, 0, S);
    expect(N).toBe(-1200);
})

test('combine overflow 80 80 80', () => {
    var N: number;
    var D: number = 80;
    var M: number = 80;
    var S: number = 80;

    // 81°20'00.0"
    N = Coordz.combine(D, M, 0);
    expect(N).toBe(8120000);

    // 80°01'20.0"
    N = Coordz.combine(D, 0, S);
    expect(N).toBe(8001200);

    // 01°21'20.0"
    N = Coordz.combine(0, M, S);
    expect(N).toBe(121200);

    // 81°21'20.0"
    N = Coordz.combine(D, M, S);
    expect(N).toBe(8121200);
})


test('combine overflow -80 80 80', () => {
    var N: number;
    var D: number = -80;
    var M: number =  80;
    var S: number =  80;

    // -81°20'00.0"
    N = Coordz.combine(D, M, 0);
    expect(N).toBe(-8120000);

    // -80°01'20.0"
    N = Coordz.combine(D, 0, S);
    expect(N).toBe(-8001200);

    // -81°21'20.0"
    N = Coordz.combine(D, M, S);
    expect(N).toBe(-8121200);
})

// technical overflow
test('combine overflow D', () => {
    var N: number;

    // 01°00'00.0"
    N = Coordz.combine(181, 0, 0);
    expect(N).toBe(100000);

    // -01°00'00.0"
    N = Coordz.combine(-181, 0, 0);
    expect(N).toBe(-100000);

    // 00°50'00.0"
    N = Coordz.combine(180, 50, 0);
    expect(N).toBe(50000);

    // -00°50'00.0"
    N = Coordz.combine(-180, 50, 0);
    expect(N).toBe(-50000);
})

test('combine total', () => {
    var N: number;

    // from total degrees
    // 52°07'27.1"
    N = Coordz.combine(52.12419, 0, 0);
    expect(N).toBe(5207271);

    // from total minutes
    // 52°07'27.1"
    N = Coordz.combine(0, 3127.45166, 0);
    expect(N).toBe(5207271);

    // from total seconds
    // 52°07'27.1"
    N = Coordz.combine(0, 0, 187647.1);
    expect(N).toBe(5207271);
})