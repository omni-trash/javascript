import {Coordz} from '../../source/coordz';

test('combine D = 55', () => {
    var N: number = Coordz.combine(55, 0, 0);
    expect(N).toBe(5500000);  
})

test('combine M = 55', () => {
    var N: number = Coordz.combine(0, 55, 0);
    expect(N).toBe(55000);
})


test('combine S = 55.5', () => {
    var N: number = Coordz.combine(0, 0, 55.5);
    expect(N).toBe(555);
})

test('combine D = -55', () => {
    var N: number = Coordz.combine(-55, 0, 0);
    expect(N).toBe(-5500000);  
})

test('combine M = -55', () => {
    var N: number = Coordz.combine(0, -55, 0);
    expect(N).toBe(-55000);
})


test('combine S = -55.5', () => {
    var N: number = Coordz.combine(0, 0, -55.5);
    expect(N).toBe(-555);
})

// 80°
test('combine D = 80', () => {
    var N: number = Coordz.combine(80, 0, 0);
    expect(N).toBe(8000000);  
})

// TODO: math.fract
// 1° 20'
test('combine M = 80', () => {
    var N: number = Coordz.combine(0, 80, 0);
    expect(N).toBe(120000);
})

// 1' 20.0"
test('combine S = 80', () => {
    var N: number = Coordz.combine(0, 0, 80);
    expect(N).toBe(1200);
})
