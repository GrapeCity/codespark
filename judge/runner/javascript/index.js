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

let defaultTimeout = 1000,
    datadir        = process.env.BASEDATA || '/data',
    casedir        = datadir + '/cases',
    caseInPostfix  = '.in',
    caseOutPostfix = '.out',
    final          = {score: 0, count: 0, results: [], timestamp: new Date().getTime()};

try {
    // clean old result
    fs.writeFileSync(datadir + '/result.json', JSON.stringify(final), 'utf8');

    let source = fs.readFileSync(datadir + '/source.js', 'utf8'),
        cases  = (files => files.map(file => path.join(casedir, file))
            .filter(file => path.extname(file) === caseInPostfix && fs.statSync(file).isFile())
            .map(file => {
                let caseId = path.basename(file, caseInPostfix);
                return {
                    id    : parseInt(caseId, 10),
                    input : readFileContent(file),
                    expect: readExpectFile(caseId)
                };
            })
            .sort((cs1, cs2) => cs1.id - cs2.id))(fs.readdirSync(casedir));

    runCaseAsync(cases, source, () => {
        process.stdout.write(`calc final score, write result to file\n`);
        final.score = final.count * final.count;
        fs.writeFileSync(datadir + '/result.json', JSON.stringify(final), 'utf8');
    });
} catch (any) {
    process.stderr.write(`Internal error: ${any} \n`);
    return;
}

function runCaseAsync(cases, source, next) {
    let cs   = cases.shift(),
        csId = cs.id;
    process.stdout.write(`run case [id: ${csId}], left ${cases.length} in pending\n`);
    new Sandbox({timeout: defaultTimeout})
        .run(source + '; process("' + cs.input + '");',
            output => {
                output.id    = csId;
                let expected = cs.expect,
                    actual   = output.result;
                process.stdout.write(`comparing expected and actual for case [id: ${csId}]: \n`);
                process.stdout.write(`expected=${expected}\n`);
                process.stdout.write(`actual  =${actual}\n`);
                // first compare all original output
                if (expected !== actual) {
                    // second deep trim all blank and newline
                    expected = deepTrim(expected);
                    actual   = deepTrim(actual);

                    if (expected !== actual) {
                        // third wrap data if result is string
                        expected = util.inspect(cs.expect);
                        actual   = output.result;

                        if (expected !== actual) {
                            // fourth deep trim again
                            expected = deepTrim(expected);
                            actual   = deepTrim(actual);
                        }
                    }
                }
                if (expected === actual) {
                    output.passed = true;
                    final.count += 1;
                }
                final.results[csId - 1] = output;

                if (cases.length > 0) {
                    runCaseAsync(cases, source, next);
                } else {
                    next();
                }
            });
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