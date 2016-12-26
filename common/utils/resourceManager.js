let _ = require('lodash'),
    logger = require('./winston').appLogger;

/**
 * managed resources pool
 */
class ResourceManager {
    /**
     * Get the resource instance by the key
     * @param key the global unique key for the resource instance
     * @return {Object} the resource instance if existed, otherwise undefined
     */
    get(key) {
        return (_.find(this._inner, function (i) {
            return i.key === key;
        }) || {}).instance;
    }

    /**
     * Add the managed resource to queue
     * @param {String} key the key to indicate resource globally
     * @param {Object} instance the resource to be managed
     * @param {Function} closeHandler the resource dispose handler function
     */
    add(key, instance, closeHandler) {
        this._inner = this._inner || [];
        this._inner.push({
            key: key,
            instance: instance,
            close: closeHandler
        })
    }

    /**
     * remove resource instance by key
     * @param {String} key
     */
    remove(key) {
        let removed = _.remove(this._inner, function (i) {
            return i.key === key;
        });
        if (removed) {
            _.each(removed, function (v) {
                v.close.call(v.instance);
            });
        }
    }

    /**
     * Dispose all managed resources
     */
    close() {
        let inner = this._inner;
        if (!inner || inner.length <= 0) {
            return;
        }
        while (this._inner.length > 0) {
            let item = this._inner.pop();
            logger.info(`begin close resource: ${item.key}`);
            if (item.close) {
                item.close.call(item.instance);
            }
        }
    }
}
module.exports = ResourceManager;