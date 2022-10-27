/* eslint-disable no-param-reassign */
/* eslint-disable import/no-extraneous-dependencies */
/**
 * Checkbox Plus Example
 *
 * @author Mohammad Fares <faressoft.com@gmail.com>
 */

import fuzzy from 'fuzzy';
import inquirer from 'inquirer';
import CheckboxPlusPrompt from '../lib/CheckboxPlusPrompt';

inquirer.registerPrompt('checkbox-plus', CheckboxPlusPrompt);

const colors = [
  { name: 'The red color', value: 'red', short: 'red', disabled: false },
  { name: 'The blue color', value: 'blue', short: 'blue', disabled: true },
  { name: 'The green color', value: 'green', short: 'green', disabled: false },
  { name: 'The yellow color', value: 'yellow', short: 'yellow', disabled: false },
  { name: 'The black color', value: { name: 'black' }, short: 'black', disabled: false },
];

inquirer
  .prompt([
    {
      type: 'checkbox-plus',
      name: 'colors',
      message: 'Enter colors',
      pageSize: 10,
      highlight: true,
      searchable: true,
      default: ['yellow', 'red', { name: 'black' }],
      validate(answer: any[]) {
        if (answer.length === 0) {
          return 'You must choose at least one color.';
        }

        return true;
      },
      source(answersSoFar, input) {
        input ||= '';

        return new Promise((resolve) => {
          const fuzzyResult = fuzzy.filter(input ?? '', colors, {
            extract: (item) => {
              return item.name;
            },
          });

          const data = fuzzyResult.map((element) => {
            return element.original;
          });

          resolve(data);
        });
      },
    },
  ])
  .then((answers) => {
    console.log('뭐지?', typeof answers.colors);
    console.log(answers.colors);
  });
