import nextConfig from 'eslint-config-next';
import typescriptEslint from '@typescript-eslint/eslint-plugin';

const config = [
  ...nextConfig,
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'import/no-anonymous-default-export': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    ignores: ['.next/**', 'coverage/**', 'node_modules/**'],
  },
];

export default config;
