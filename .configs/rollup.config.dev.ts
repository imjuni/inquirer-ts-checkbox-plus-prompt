import { nodeResolve } from '@rollup/plugin-node-resolve';
import readPackage from 'read-pkg';
import ts from 'rollup-plugin-ts';

const pkg = readPackage.sync();

export default [
  {
    input: 'lib/index.ts',
    output: [
      {
        format: 'cjs',
        file: 'dist/cjs/index.js',
      },
      {
        format: 'esm',
        file: 'dist/esm/index.js',
      },
    ],
    plugins: [
      nodeResolve({
        resolveOnly: (module) =>
          pkg?.dependencies?.[module] == null && pkg?.devDependencies?.[module] == null,
      }),
      ts({ tsconfig: 'tsconfig.json' }),
    ],
  },
];
