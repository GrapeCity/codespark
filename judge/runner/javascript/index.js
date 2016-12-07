var fs = require('fs'),
    util = require('util'),
    Sandbox = require("sandbox");

// With following assume, [data] folder will place all data files
// +- data
//   |- cases.json     * all use cases to be running
//   |- source.js      * the source code of solution
//   |- result.json    * the result (score and outputs)

fs.readFile('data/cases.json', 'utf8', function (err1, casesText) {
    if (err1) {
        process.stderr.write('Error read file [data/cases.json]: ' + err1);
        return;
    }
    var cases = JSON.parse(casesText);
    if (cases.length > 0) {
        fs.readFile('data/source.js', 'utf8', function (err2, code) {
            if (err2) {
                process.stderr.write('Error read file [data/code.js]: ' + err2);
                return;
            }

            for (var i in cases) {
                var box = new Sandbox({timeout: 2000});
                box.cs = cases[i];
                box.run(code + '; process("' + cases[i].input + '");',
                    function (output) {
                        var cs = this.cs;
                        console.log('' + cs.id + ':' + util.inspect(cs.expect) + '<>' + output.result);
                    });
            }
        });
    }
});
