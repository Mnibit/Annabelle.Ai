const { greet } = require('./index');

describe('Annabelle.AI', () => {
  test('greet should return a greeting message', () => {
    expect(greet('World')).toBe('Hello, World!');
  });

  test('greet should handle different names', () => {
    expect(greet('Annabelle')).toBe('Hello, Annabelle!');
  });
});
