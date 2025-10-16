export class PerformanceLogger {
  private timings: Map<string, number>;
  private startTime: number;

  constructor() {
    this.timings = new Map();
    this.startTime = Date.now();
  }

  mark(label: string) {
    const elapsed = Date.now() - this.startTime;
    this.timings.set(label, elapsed);
  }

  getReport(): Record<string, string> {
    const report: Record<string, string> = {};
    let previousTime = 0;

    for (const [label, time] of this.timings.entries()) {
      const duration = time - previousTime;
      report[label] = `${duration}ms (total: ${time}ms)`;
      previousTime = time;
    }

    return report;
  }

  log() {
    console.log("\n📊 Performance Report:");
    const report = this.getReport();
    for (const [label, timing] of Object.entries(report)) {
      console.log(`  ${label}: ${timing}`);
    }
    console.log("");
  }
}
