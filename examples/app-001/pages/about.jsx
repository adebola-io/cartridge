import { createElement } from '../setup.js';
import { css } from '@adbl/bullet';

export default createElement({
  tag: 'about-page',
  render: () => {
    console.log();
    return (
      <div>
        <h1>Hello from the server!</h1>
        <p>This is the about page.</p>
      </div>
    );
  },

  styles: css`
    div {
      min-width: 100vw;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  `,
});
