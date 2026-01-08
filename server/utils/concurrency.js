/**
 * Simple concurrency limit helper (like p-limit)
 * @param {number} limit - Max number of concurrent promises
 * @returns {function} - Generator function
 */
const pLimit = (limit) => {
    const queue = [];
    let activeCount = 0;

    const next = () => {
        activeCount--;
        if (queue.length > 0) {
            queue.shift()();
        }
    };

    const run = async (fn, resolve, args) => {
        activeCount++;
        const result = (async () => fn(...args))();
        resolve(result);

        try {
            await result;
        } catch {
            // ignore error here, handled in result
        }

        next();
    };

    const enqueue = (fn, resolve, args) => {
        queue.push(run.bind(null, fn, resolve, args));

        (async () => {
            if (activeCount < limit && queue.length > 0) {
                queue.shift()();
            }
        })();
    };

    const generator = (fn, ...args) => {
        return new Promise((resolve) => {
            enqueue(fn, resolve, args);
        });
    };

    return generator;
};

module.exports = pLimit;
