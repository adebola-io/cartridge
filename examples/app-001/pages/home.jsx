import { css } from '@adbl/bullet';
import { createElement } from '../setup.js';
import { Cell } from '@adbl/cells';
import { Button } from '../components/button.jsx';

export default createElement({
  tag: 'home-page',
  inlineStyles: true,

  render: () => {
    const count = Cell.source(0);

    return (
      <>
        <h1>Hello from the server!</h1>
        <output>{count}</output>
        <Button type="button" onClick={() => count.value++}>
          Click Me!
        </Button>
      </>
    );
  },

  globalStyles: css`
    body {
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
  `,

  styles: css`
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
    }

    output {
      font-size: 4rem;
      font-weight: bold;
    }
  `,
});
