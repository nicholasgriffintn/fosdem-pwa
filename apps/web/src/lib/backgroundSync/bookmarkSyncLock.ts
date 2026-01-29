type LockRelease = () => void;

let lockQueue: Promise<void> = Promise.resolve();

function createLock(): { promise: Promise<void>; release: LockRelease } {
  let release: LockRelease = () => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

export async function withBookmarkSyncLock<T>(task: () => Promise<T>): Promise<T> {
  const previous = lockQueue;
  const { promise, release } = createLock();

  lockQueue = previous.then(() => promise);
  await previous;

  try {
    return await task();
  } finally {
    release();
  }
}
