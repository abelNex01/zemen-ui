// Performance monitoring utilities (dev-only)
// Tracks FPS, long tasks, and provides performance insights

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  longTasks: number;
}

class PerformanceMonitor {
  private fps: number = 60;
  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private frameTimes: number[] = [];
  private longTaskCount: number = 0;
  private rafId: number | null = null;
  private isEnabled: boolean = false;

  start() {
    if (this.isEnabled) return;
    this.isEnabled = true;
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.frameTimes = [];
    this.longTaskCount = 0;

    // Monitor FPS
    const measureFPS = () => {
      if (!this.isEnabled) return;

      const now = performance.now();
      const delta = now - this.lastTime;
      this.frameTimes.push(delta);

      // Keep only last 60 frames
      if (this.frameTimes.length > 60) {
        this.frameTimes.shift();
      }

      // Calculate average FPS
      if (this.frameTimes.length > 0) {
        const avgFrameTime =
          this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        this.fps = Math.round(1000 / avgFrameTime);
        this.frameTime = avgFrameTime;
      }

      this.lastTime = now;
      this.frameCount++;

      this.rafId = requestAnimationFrame(measureFPS);
    };

    this.rafId = requestAnimationFrame(measureFPS);

    // Monitor long tasks (if PerformanceObserver is available)
    if (typeof PerformanceObserver !== "undefined") {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              // Task longer than 50ms
              this.longTaskCount++;
              if (process.env.NODE_ENV === "development") {
                console.warn(
                  `Long task detected: ${entry.duration.toFixed(2)}ms`
                );
              }
            }
          }
        });
        observer.observe({ entryTypes: ["longtask"] });
      } catch (e) {
        // Long task monitoring not supported
      }
    }
  }

  stop() {
    this.isEnabled = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getMetrics(): PerformanceMetrics {
    return {
      fps: this.fps,
      frameTime: this.frameTime || 16.67,
      longTasks: this.longTaskCount,
    };
  }

  reset() {
    this.frameCount = 0;
    this.frameTimes = [];
    this.longTaskCount = 0;
  }
}

// Singleton instance
let monitorInstance: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor();
  }
  return monitorInstance;
}

// Auto-start in development
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  // Expose to window for debugging
  (window as any).__performanceMonitor = getPerformanceMonitor();
  getPerformanceMonitor().start();
}
