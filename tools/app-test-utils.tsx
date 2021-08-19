import React from 'react';
import { screen, render, waitForElementToBeRemoved } from '@testing-library/react';
import { SWRConfig } from 'swr';

const SwrWrapper = ({ children }) => {
  return <SWRConfig value={{ dedupingInterval: 0 }}>{children}</SWRConfig>;
};
const customRender = (ui, options?) => render(ui, { wrapper: SwrWrapper, ...options });

const waitForLoadingToFinish = () =>
  waitForElementToBeRemoved(() => [...screen.queryAllByRole(/progressbar/i)], {
    timeout: 4000,
  });

export { SwrWrapper, waitForLoadingToFinish };
export { customRender as render };
