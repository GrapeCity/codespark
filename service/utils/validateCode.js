let _ = require('lodash');

class CodeValidator {

    getPattern(key) {
        return CodeValidator.patterns[key] || (CodeValidator.patterns[key] = new RegExp(`(${key})`, 'i'));
    }

    getKeywords() {
        return ['shutdown'];
    }

    validate(source) {
        return _.takeWhile(_.map(this.getKeywords(), key => {
            let match = source.match(this.getPattern(key));
            return {
                key: key,
                value: match && match.length
            }
        }), v => v.value > 0);
    }
}

CodeValidator.patterns = {};

class JavaScriptCodeValidator extends CodeValidator {
    getKeywords() {
        return _.union(super.getKeywords(), ['eval', 'new function']);
    }
}

class CSharpCodeValidator extends CodeValidator {
    getKeywords() {
        return _.union(super.getKeywords(), ['Process']);
    }
}

/**
 * validate the source code with forbidden key words
 * @param {String} source
 * @param {String} runtime
 * @param {Array} validation
 */
module.exports = (source, runtime, validation) => {
    let validator = new JavaScriptCodeValidator();
    switch (runtime) {
        case 'csharp':
            validator = new CSharpCodeValidator();
            break;
        case 'javascript':
        default:
            break;
    }
    validator.validate(source).forEach(e => {
        validation.push({
            msg: `代码中出现${e.value}次关键字"${e.key}"`
        });
    });
};