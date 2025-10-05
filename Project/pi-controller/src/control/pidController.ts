export class PIDController {
  private kp: number;
  private ki: number;
  private kd: number;
  private setpoint: number;
  private outputMin: number;
  private outputMax: number;

  private integral = 0;
  private lastError = 0;
  private lastTime: number = Date.now();

  constructor(
    kp: number,
    ki: number,
    kd: number,
    setpoint: number,
    outputMin: number,
    outputMax: number
  ) {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
    this.setpoint = setpoint;
    this.outputMin = outputMin;
    this.outputMax = outputMax;
  }

  update(processVariable: number): number {
    const now = Date.now();
    const dt = (now - this.lastTime) / 1000; // Convert to seconds

    const error = this.setpoint - processVariable;

    // Proportional term
    const pTerm = this.kp * error;

    // Integral term
    this.integral += error * dt;
    const iTerm = this.ki * this.integral;

    // Derivative term
    const derivative = (error - this.lastError) / dt;
    const dTerm = this.kd * derivative;

    // Calculate output
    let output = pTerm + iTerm + dTerm;

    // Clamp output
    output = Math.max(this.outputMin, Math.min(this.outputMax, output));

    // Anti-windup: prevent integral windup
    if (output === this.outputMin || output === this.outputMax) {
      this.integral -= error * dt;
    }

    // Update state
    this.lastError = error;
    this.lastTime = now;

    return output;
  }

  reset() {
    this.integral = 0;
    this.lastError = 0;
    this.lastTime = Date.now();
  }

  setSetpoint(setpoint: number) {
    this.setpoint = setpoint;
  }
}
