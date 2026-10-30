const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Mirrors the API rules so the same messages show online and offline. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters for your password.';
  if (password.length > 128) return 'Use at most 128 characters for your password.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Use letters and at least one number in your password.';
  return null;
}

export function validateRegistration(input: { name: string; email: string; password: string }) {
  const name = input.name.trim().replace(/\s+/g, ' ');
  const email = normalizeEmail(input.email);
  if (name.length < 2 || name.length > 80) throw new Error('Enter your name (2–80 characters).');
  if (!EMAIL.test(email) || email.length > 320) throw new Error('Enter a valid email address.');
  const problem = passwordProblem(input.password);
  if (problem) throw new Error(problem);
  return { name, email, password: input.password };
}

export function validateSignIn(input: { email: string; password: string }) {
  const email = normalizeEmail(input.email);
  if (!EMAIL.test(email)) throw new Error('Enter a valid email address.');
  if (!input.password) throw new Error('Enter your password.');
  return { email, password: input.password };
}
