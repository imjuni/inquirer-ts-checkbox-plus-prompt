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
  'The red color',
  'The blue color',
  'The green color',
  'The yellow color',
  'The black color',
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
      source(answersSoFar, input) {
        input ||= '';

        return new Promise((resolve) => {
          const fuzzyResult = fuzzy.filter(input ?? '', colors, {
            extract: (item) => {
              return item;
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
    console.log(answers.colors);
  });
