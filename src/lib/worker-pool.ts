// Worker pool for managing Web Workers efficiently
// Reuses workers to avoid overhead of creating new ones

class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
    request: any;
  }> = [];
  private maxWorkers: number;
  private workerScript: string;

  constructor(workerScript: string, maxWorkers = 4) {
    this.workerScript = workerScript;
    this.maxWorkers = maxWorkers;
  }

  private createWorker(): Worker {
    return new Worker(new URL(this.workerScript, import.meta.url), {
      type: "module",
    });
  }

  async execute<TRequest, TResponse>(request: TRequest): Promise<TResponse> {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, request });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) return;

    // Get or create a worker
    let worker = this.workers.find((w) => !(w as any).busy);
    if (!worker && this.workers.length < this.maxWorkers) {
      worker = this.createWorker();
      this.workers.push(worker);
    }

    if (!worker) {
      // All workers busy, wait a bit
      setTimeout(() => this.processQueue(), 10);
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    (worker as any).busy = true;

    const handleMessage = (e: MessageEvent<TResponse>) => {
      worker!.removeEventListener("message", handleMessage);
      worker!.removeEventListener("error", handleError);
      (worker as any).busy = false;
      task.resolve(e.data);
      this.processQueue();
    };

    const handleError = (error: ErrorEvent) => {
      worker!.removeEventListener("message", handleMessage);
      worker!.removeEventListener("error", handleError);
      (worker as any).busy = false;
      task.reject(error);
      this.processQueue();
    };

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);
    worker.postMessage(task.request);
  }

  terminate() {
    this.workers.forEach((w) => w.terminate());
    this.workers = [];
    this.queue = [];
  }
}

// Geometry worker pool - simplified for now (workers can be added later if needed)
// For now, we use synchronous calculations which are fast enough for most cases
let geometryWorkerPool: WorkerPool | null = null;

export function getGeometryWorkerPool(): WorkerPool | null {
  // Workers disabled for now - synchronous calculations are fast enough
  // Can be enabled later if needed for very large datasets
  return null;
}

export function terminateWorkerPools() {
  if (geometryWorkerPool) {
    geometryWorkerPool.terminate();
    geometryWorkerPool = null;
  }
}
