= build dist files =

tsc -p .\build\tsconfig.amd.json
tsc -p .\build\tsconfig.commonjs.json
tsc -p .\build\tsconfig.es2015.json
tsc -p .\build\tsconfig.legacy.json
tsc -p .\build\tsconfig.system.json
tsc -p .\build\tsconfig.umd.json

= debug =
tsc --watch
tsc -w

use test.debug.html for development
