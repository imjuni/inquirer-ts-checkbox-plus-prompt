# Inquirer TypeScript Checkbox Plus Prompt

A plugin for [Inquirer](https://github.com/SBoudrias/Inquirer.js), similar to the original checkbox with extra features. This project is TypeScript port from [inquirer-checkbox-plus-prompt](https://github.com/faressoft/inquirer-checkbox-plus-prompt)

[![npm](https://img.shields.io/npm/v/inquirer-ts-checkbox-plus-prompt.svg)](https://www.npmjs.com/package/inquirer-ts-checkbox-plus-prompt)
[![npm](https://img.shields.io/npm/l/inquirer-ts-checkbox-plus-prompt.svg)](https://github.com/faressoft/inquirer-ts-checkbox-plus-prompt/blob/master/LICENSE)

![Demo](/demo.gif?raw=true)

## Installation

```bash
npm install -g inquirer-ts-checkbox-plus-prompt
```

## Usage

You can name it with any name other than `checkbox-plus`, just change the string `'checkbox-plus'` to anything else.

```js
import { CheckboxPlusPrompt } from 'inquirer-ts-checkbox-plus-prompt';

inquirer.registerPrompt('checkbox-plus', CheckboxPlusPrompt);

inquirer.prompt({
  type: 'checkbox-plus',
  ...
})
```

## Options

Takes `type`, `name`, `message`, `source`[, `filter`, `validate`, `default`, `pageSize`, `highlight`, `searchable`] properties.

The extra options that this plugin provides are:

- **source**: (Function) a method that called to return a promise that should be resolved with a list of choices in a similar format as the `choices` option in the original `checkbox` prompt of `Inquirer`.
- **highlight**: (Boolean) if `true`, the current selected choice gets highlighted. Default: `false`.
- **searchable**: (Boolean) if `true`, allow the user to filter the list. The `source` function gets called everytime the search query is changed. Default: `false`.

## Example

Check [example.ts](/example.ts?raw=true) for a more advanced example.

```ts
import fuzzy from 'fuzzy';
import inquirer from 'inquirer';
import CheckboxPlusPrompt from '../lib/CheckboxPlusPrompt';

inquirer.registerPrompt('checkbox-plus', CheckboxPlusPrompt);

const colors = ['red', 'green', 'blue', 'yellow'];

inquirer
  .prompt([
    {
      type: 'checkbox-plus',
      name: 'colors',
      message: 'Enter colors',
      pageSize: 10,
      highlight: true,
      searchable: true,
      default: ['yellow', 'red'],
      source(answersSoFar, input) {
        input ||= '';

        return new Promise((resolve) => {
          const fuzzyResult = fuzzy.filter(input, colors);

          const data = fuzzyResult.map((element) => {
            return element.original;
          });

          resolve(data);
        });
      },
    },
  ])
  .then((answers) => {
    console.log(answers.colors);
  });
```

## License

This project is under the MIT license.
