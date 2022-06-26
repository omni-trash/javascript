/**
 * Test render() functionality
 */

 import {Coordz} from '../../source/coordz';

 test('render lat 5050505', () => {
     var data: Coordz.IData = Coordz.data(5050505);
     var text: string;

     text = data.lat().render(Coordz.Format.Default);
     expect(text).toBe("50°50'50.5\"N");

     // 50 + 50 / 60 + 50.5 / 60 / 60
     text = data.lat().render(Coordz.Format.Degrees);
     expect(text).toBe("50.84736°");

     // 50 * 60 + 50 + 50.5 / 60
     text = data.lat().render(Coordz.Format.Minutes);
     expect(text).toBe("3050.84166'");

     // 50 * 60 * 60 + 50 * 60 + 50.5
     text = data.lat().render(Coordz.Format.Seconds);
     expect(text).toBe("183050.50000\"");
 })

 test('render lat -5050505', () => {
    var data: Coordz.IData = Coordz.data(-5050505);
    var text: string;

    text = data.lat().render(Coordz.Format.Default);
    expect(text).toBe("50°50'50.5\"S");

    // -(50 + 50 / 60 + 50.5 / 60 / 60)
    text = data.lat().render(Coordz.Format.Degrees);
    expect(text).toBe("-50.84736°");

    // -(50 * 60 + 50 + 50.5 / 60)
    text = data.lat().render(Coordz.Format.Minutes);
    expect(text).toBe("-3050.84166'");

    // -(50 * 60 * 60 + 50 * 60 + 50.5)
    text = data.lat().render(Coordz.Format.Seconds);
    expect(text).toBe("-183050.50000\"");
})
 
 test('render H', () => {
    expect(Coordz.data( 50).lat().render('H')).toBe("N");
    expect(Coordz.data(-50).lat().render('H')).toBe("S");
    expect(Coordz.data( 50).lon().render('H')).toBe("E");
    expect(Coordz.data(-50).lon().render('H')).toBe("W");
})

test('render -1', () => {
    // N == -10
    var N : number = Coordz.combine(0, 0, -1);
    var data: Coordz.IData = Coordz.data(N);
    var text: string;

    text = data.lat().render("N");
    expect(text).toBe("-10");

    text = data.lat().render("n");
    expect(text).toBe("10");

    text = data.lat().render("d.ddddd");
    expect(text).toBe("0.00027");

    text = data.lat().render("m.mmmmm");
    expect(text).toBe("0.01666");

    text = data.lat().render("s.sssss");
    expect(text).toBe("1.00000");

    text = data.lat().render("D.ddddd");
    expect(text).toBe("-0.00027");

    text = data.lat().render("M.mmmmm");
    expect(text).toBe("-0.01666");

    text = data.lat().render("S.sssss");
    expect(text).toBe("-1.00000");

    text = data.lat().render("dd mm ss.s");
    expect(text).toBe("00 00 01.0");

    text = data.lat().render("D");
    expect(text).toBe("-0");

    text = data.lat().render("DD mm ss.s");
    expect(text).toBe("-00 00 01.0");

    text = data.lat().render("DDD m.mmm");
    expect(text).toBe("-000 0.016");
})
