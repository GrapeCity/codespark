let fs      = require('fs'),
    path    = require('path'),
    util    = require('util'),
    Sandbox = require("sandbox");

// With following assume, [data] folder will place all data files
// +- data
//   |- cases          * all use cases to be running
//     |- 1.in         * input file for case 1
//     |- 1.out        * expect output for case 1
//   |- source.js      * the source code of solution
//   |- result.json    * the result (score and outputs)

let defaultTimeout  = 1000,
    datadir         = process.env.BASEDATA || '/data',
    casedir         = datadir + '/cases',
    caseInPostfix   = '.in',
    caseOutPostfix  = '.out',
    currentRunIndex = 0,
    result          = {score: 0, outputs: [], timestamp: new Date().getTime()};

try {
    // clean old result
    fs.writeFileSync(datadir + '/result.json', JSON.stringify(result), 'utf8');

    let source = fs.readFileSync(datadir + '/source.js', 'utf8'),
        cases  = (function (files) {
            return files.map(function (file) {
                return path.join(casedir, file);
            }).filter(function (file) {
                return path.extname(file) === caseInPostfix && fs.statSync(file).isFile();
            }).map(function (file) {
                let caseId = path.basename(file, caseInPostfix);
                return {
                    id    : parseInt(caseId, 10),
                    input : readFileContent(file),
                    expect: readExpectFile(caseId)
                };
            }).sort(function (cs1, cs2) {
                return cs1.id - cs2.id;
            });
        })(fs.readdirSync(casedir));

    for (let i = 0; i < cases.length; i++) {
        runCase(i, source, cases[i]);
    }

} catch (any) {
    process.stderr.write('Run case error: ' + any);
    return;
}

function runCase(index, source, cs) {
    let caseId = cs.id;
    if (index > currentRunIndex) {
        setTimeout(function () {
            // next tick, run again
            runCase(index, source, cs);
        }, (index - currentRunIndex) * 10);
    } else {
        // yep, resource ready, run the case
        let box = new Sandbox({timeout: defaultTimeout});
        box.run(source + '; process("' + cs.input + '");',
            function (output) {
                let expected = util.inspect(cs.expect),
                    actual   = output.result;
                if (expected !== actual) {
                    expected = deepTrim(expected);
                    actual   = deepTrim(actual);
                }
                if (expected === actual) {
                    result.score += Math.pow(cs.id, 2);
                }
                result.outputs[caseId - 1] = output;

                // done, move to next case
                currentRunIndex++;

                if (currentRunIndex === cases.length) { // run last one
                    fs.writeFileSync(datadir + '/result.json', JSON.stringify(result), 'utf8');
                }
            });
    }
}

function readFileContent(file) {
    return fs.readFileSync(file, 'utf8');
}

function readExpectFile(caseId) {
    return readFileContent(path.join(casedir, caseId + caseOutPostfix));
}

function deepTrim(realString) {
    realString       = realString.trim();
    let resultString = '', lastChar = '';
    for (let i = 0; i < realString.length; i++) {
        let currentChar = realString[i];
        if ((lastChar === ' ' || lastChar === '\u00A0') &&
            (currentChar === ' ' || currentChar === '\u00A0')) {
            continue;
        }
        resultString += currentChar;
        lastChar = currentChar;
    }
    return resultString;
}