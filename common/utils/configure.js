let fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    logger = require('./winston').appLogger;

class Configure {
    /**
     *
     * @param {string} folder the folder to lookup
     * @param {string} postfix the file postfix to watch
     */
    constructor(folder = '', postfix = '') {
        this.baseFolder = folder || path.join(process.cwd(), 'conf');
        this.filePostfix = postfix || '.json';
        this.fallback = {};
        this.config = {};
        this.watches = [];
        this.watchFile();
    }

    /**
     *
     * @param file
     * @return {Promise}
     * @private
     */
    loadConfigAsync(file) {
        return new Promise((resolve, reject) => {
            fs.readFile(path.join(this.baseFolder, file), 'utf8', (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(JSON.parse(data));
            });
        });
    }

    /**
     *
     * @param file
     * @param defaultValue
     * @return {Object}
     * @private
     */
    loadConfigSync(file, defaultValue) {
        let data = {};
        try {
            data = JSON.parse(fs.readFileSync(path.join(this.baseFolder, file), 'utf8'));
        } catch (any) {
            logger.warn(`${file} is not existed, will use default`);
        }
        return _.extend(defaultValue, data);
    }

    watchFile() {
        if (fs.existsSync(this.baseFolder)) {
            this.watches.push(fs.watch(this.baseFolder, (evt, fn) => {
                if (fn && fn.substr(fn.length - this.filePostfix.length, this.filePostfix.length) === this.filePostfix) {
                    let module = fn.substr(0, fn.length - this.filePostfix.length);
                    this.loadConfigAsync(fn)
                        .then(data => {
                            if (data) {
                                logger.info(`reload config for [${module}]`);
                                this.config[module] = this.fallback[module];
                            }
                        })
                        .catch(err => {
                            logger.warn(`Something wrong: ${err}`);
                        })
                }
            }));
        }
    }

    setup(module, defaultValue) {
        let file = `${module}${this.filePostfix}`;
        this.fallback[module] = defaultValue;
        this.config[module] = this.loadConfigSync(file, defaultValue);
        Object.defineProperty(this, module, {
            get: () => this.config[module],
            enumerable: false,
            configurable: false
        });
    }

    close(done) {
        while (this.watches.length > 0) {
            let watch = this.watches.pop();
            watch.close();
        }
        done && done();
    }
}

module.exports = Configure;