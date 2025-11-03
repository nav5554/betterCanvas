// lib/limit.ts
export function createLimiter(concurrency = 3) {
  let active = 0;
  const queue: Array<() => void> = [];

  const next = () => {
    active--;
    const fn = queue.shift();
    if (fn) fn();
  };

  return function <T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = () => {
        active++;
        task().then((v) => { next(); resolve(v); })
               .catch((e) => { next(); reject(e); });
      };
      if (active < concurrency) run();
      else queue.push(run);
    });
  };
}