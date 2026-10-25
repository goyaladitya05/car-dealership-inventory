import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['coverage', 'dist'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  prettier,
);
