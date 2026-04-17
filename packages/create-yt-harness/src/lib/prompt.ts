import { createInterface } from "node:readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

export function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

export function promptRequired(question: string, fieldName: string): Promise<string> {
  return new Promise((resolve) => {
    const ask = (): void => {
      rl.question(question, (answer) => {
        const val = answer.trim();
        if (!val) {
          console.log(`  \u26a0  ${fieldName} は必須です。もう一度入力してください。`);
          ask();
          return;
        }
        resolve(val);
      });
    };
    ask();
  });
}

export function promptDefault(question: string, defaultValue: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(`${question} [${defaultValue}]: `, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

export function promptConfirm(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(`${question} (y/N): `, (answer) => {
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

export function closePrompt(): void {
  rl.close();
}
