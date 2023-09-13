export default {
  '*.ts': () => 'tsc --noEmit',
  '*.{js,ts}': ['eslint --fix', 'vitest related --run'],
  '*': 'prettier --ignore-unknown --write',
};
