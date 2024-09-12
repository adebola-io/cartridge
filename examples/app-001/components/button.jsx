import { css } from '@adbl/bullet';
import { createElement } from '../setup.js';

export const Button = createElement({
  tag: 'button',
  inlineStyles: true,

  /** @param {JSX.IntrinsicElements['button']} props */
  render: (props) => {
    return (
      <button {...props}>
        <slot />
      </button>
    );
  },
  styles: css`
    button {
      color: white;
      background-color: black;
      padding: 15px 20px;
      border: 2px solid black;
    }
  `,
});
