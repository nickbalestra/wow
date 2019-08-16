import crypto from "crypto";
import { basename } from "path";
import { performance, PerformanceObserver } from "perf_hooks";

export function generateHash(length = 15) {
  const current_date = new Date().valueOf().toString();
  const random = Math.random().toString();
  const hash = crypto
    .createHash("sha1")
    .update(current_date + random)
    .digest("hex");
  return hash.substr(0, length);
}

export function isNotDirectoryOrDotFile(file, stats) {
  return stats.isDirectory() || basename(file)[0] === ".";
}

export function responseHandler(cb = () => {}) {
  return ({ data: { errors, result } }) =>
    errors.length ? Promise.reject(...errors) : cb(result);
}

export class Perf {
  constructor() {
    this.elapsed = 0;
    const obs = new PerformanceObserver(items => {
      this.elapsed = items.getEntries()[0].duration;
      performance.clearMarks();
    });
    obs.observe({ entryTypes: ["measure"] });
  }
  start() {
    performance.mark("start");
  }
  end() {
    performance.mark("end");
  }
  duration() {
    performance.measure("Start to end", "start", "end");
    return this.elapsed > 1000
      ? (this.elapsed / 1000).toFixed(2) + "s"
      : this.elapsed.toFixed(2) + "ms";
  }
}
