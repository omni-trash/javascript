# TODO
## datalist
Also ich habe mir diverse Bibliotheken zum Thema autocomplete angeschaut und getestet, aber kaum eine hat meine Erwartungen erfüllt. Wahrscheinlich auch wieder mal zu speziell, oder ich war wieder mal nicht so geduldig. Es sollte ein Ersatz für eine `datalist` (HTML) sein, die dann auch in den meisten Browsern gleich aussieht und sich auch gleich verhält.

Oftmals haben wir in der Firma Suchmasken mit Nummern, was so ziemlich typisch für eine Firma ist, und wenn man darin auch nach Text wie Kundenname suche kann, oh das wäre echt super. Benötigt wird aber primär immer eine Nummer, damit ist ein ERP besser bedient. Also gut, was tun. Im IE11 sah die `datalist` noch ganz ok aus, dort wird `value` und `label` angezeigt, aber mit Edge, Chrome, Firefox etc. verhält sich das mal ganz anders. 

Ok, was'ne `datalist` ist, da könnt ihr gerne mal nach suchen. Hier ganz kurz:

```html
<input type="text" id="country" placeholder="Eingabe" list="countries">
<datalist id="countries">
		<option value="0001" label="Afghanistan">
		<option value="0002" label="Albania">
		<option value="0003" label="Algeria">
		<option value="0004" label="Andorra">
		<option value="0005" label="Angola">
		<option value="0006" label="Anguilla">
</datalist>
```

Das ist dann im Prinzip eine Autovervollständigung, `label` wird angezeigt und `value` wird beim Senden vom Formular übermittelt. Gut das läßt sich jetzt vllt. irgendwie nachbilden, bisschen Skript drumrum, bekommt man schon hin, gibt ja auch polyfills. Naja, bisschen Skript habe ich nun drumrum gebaut, das Ergebnis findet sich hier auf diesen Seiten, viel Spaß. Man muß dazu sagen, dass im Eingabefeld die Nummer bzw. `value` angezeigt wird, und nur im Auswahlfeld wird dann beides (`value` + `label`) dargestellt. Liegt daran, dass ich das Eingabefeld übermitteln möchte. Unsere Kundschaft kennt sich auch ziemlich gut mit den Nummern aus, das zusätzliche Anzeigen von Text ist ein Bonus.


## Einbinden

Das ist einfach, die zwei Dateien aus dem dist-Ordner runterladen und wie gewohnt im HTML-Dokument unterbringen.

```html
<link rel="stylesheet" href="./autocomplete.css">
```

und dann am Ende der Seite

```html
<script src="./autocomplete.js"></script>
<script>
    var input = document.getElementById('country');
    autocomplete(input);
</script>
```

Wenn ihr jQuery nutzen möchtet, dann das zuerst laden. Unser Skript registriert sich dort, und ist dann nicht mehr global verfügbar.

```html
<link rel="stylesheet" href="./autocomplete.css">
```

und dann am Ende der Seite

```html
<script src="./jquery.js"></script>
<script src="./autocomplete.js"></script>
<script>
    $('input[type=text][list]').autocomplete();
</script>
```

Wenn ihr jetzt noch das `label` woanders anzeigen möchtet, dann einfach das Eingabefeld um das Attribut `data-autocomplete-label` erweitern, und dort die ID eintragen.

```html
<input type="text" id="country" placeholder="Eingabe" list="countries" data-autocomplete-label="countryLabel">
<span id="countryLabel"></span>

<datalist id="countries">
        <option value="0001" label="Afghanistan">
        <option value="0002" label="Albania">
        <option value="0003" label="Algeria">
        <option value="0004" label="Andorra">
        <option value="0005" label="Angola">
        <option value="0006" label="Anguilla">
</datalist>
```

Ok, jetzt habt ihr kurz und knapp das meiste erfahren. Es sei noch erwähnt, dass unser Skript einen Container um das Eingabefeld generiert. Das ist fürs Layout erforderlich. Ihr solltet diese Gegebenheit dann bei Euren Stylesheets beachten und ggf. diesen Container wie das Eingabefeld dort mit aufnehmen.

Der Container wird automatisch erstellt!

```html
<div class="autocomplete-container">
    <input type="text" id="country" placeholder="Eingabe" data-autocomplete-label="countryLabel" autocomplete="off" spellcheck="false" title="Albania">
</div>
<span id="countryLabel">Albania</span>

<datalist id="countries">
    <option value="0001" label="Afghanistan">
    <option value="0002" label="Albania">
    <option value="0003" label="Algeria">
    <option value="0004" label="Andorra">
    <option value="0005" label="Angola">
    <option value="0006" label="Anguilla">
</datalist>
```

TODO: ... more details

## Version 1.22.8.20

- HTML in ``option``, ohne extra ``render()``-Funktion (z.B. für Vue-Template etc.)
- ``label`` für ``data-autocomplete-label``, ansonsten nicht erforderlich

```html
<datalist id="countries">
    <option value="0001" label="Afghanistan">
        <div>
            <div><b>0001</b></div>
            <div>Afghanistan</div>
            <div><small><i>Kabul</i></small></div>
        </div>
    </option>

    <option value="0002" label="Albania">
        <div>
            <div><b>0002</b></div>
            <div>Albania</div>
            <div><small><i>Tirana</i></small></div>
        </div>
    </option>
    ...
</datalist>
```
