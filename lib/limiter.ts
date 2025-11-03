export function createLimiter(concurrency: number) {
  let active = 0;
  const queue: Array<() => void> = [];
  const next = () => { active--; if (queue.length) queue.shift()!(); };
  return async <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise((resolve, reject) => {
      const runIt = () => {
        active++; fn().then((v)=>{next();resolve(v);},(e)=>{next();reject(e);});
      };
      active < concurrency ? runIt() : queue.push(runIt);
    });
}