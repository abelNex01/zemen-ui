// Intelligent state batching for Zustand
// Batches multiple rapid updates into a single commit

interface BatchedUpdate<T> {
  id: string;
  updates: Partial<T>;
  timestamp: number;
}

class StateBatcher<T> {
  private batch: Map<string, BatchedUpdate<T>> = new Map();
  private timeoutId: number | null = null;
  private commitDelay: number;
  private commitCallback: (updates: Map<string, Partial<T>>) => void;

  constructor(
    commitCallback: (updates: Map<string, Partial<T>>) => void,
    commitDelay = 16 // ~1 frame at 60fps
  ) {
    this.commitCallback = commitCallback;
    this.commitDelay = commitDelay;
  }

  add(id: string, updates: Partial<T>) {
    const existing = this.batch.get(id);
    if (existing) {
      // Merge updates
      existing.updates = { ...existing.updates, ...updates };
      existing.timestamp = Date.now();
    } else {
      this.batch.set(id, {
        id,
        updates,
        timestamp: Date.now(),
      });
    }

    // Schedule commit
    this.scheduleCommit();
  }

  private scheduleCommit() {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = window.setTimeout(() => {
      this.commit();
    }, this.commitDelay);
  }

  private commit() {
    if (this.batch.size === 0) return;

    const updates = new Map(this.batch);
    this.batch.clear();
    this.timeoutId = null;

    this.commitCallback(updates);
  }

  flush() {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.commit();
  }

  clear() {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.batch.clear();
  }
}

// Element update batcher
let elementBatcher: StateBatcher<any> | null = null;

export function getElementBatcher(
  commitCallback: (updates: Map<string, any>) => void
): StateBatcher<any> {
  if (!elementBatcher) {
    elementBatcher = new StateBatcher(commitCallback, 16);
  }
  return elementBatcher;
}

export function flushElementBatcher() {
  if (elementBatcher) {
    elementBatcher.flush();
  }
}

export function clearElementBatcher() {
  if (elementBatcher) {
    elementBatcher.clear();
  }
}
