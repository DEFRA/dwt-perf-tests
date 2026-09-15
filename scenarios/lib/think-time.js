import { sleep } from 'k6';

/**
 * Pause between 500ms and 1500ms after each request.
 */
export function thinkTime() {
  sleep((500 + Math.random() * 1000) / 1000);
}
