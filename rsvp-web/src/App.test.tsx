import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders RSVP Planning App header', () => {
  render(<App />);
  const headerElement = screen.getByText(/RSVP Planning App/i);
  expect(headerElement).toBeInTheDocument();
});

test('renders wedding title', () => {
  render(<App />);
  const weddingElement = screen.getByText(/Sarah & John's Wedding/i);
  expect(weddingElement).toBeInTheDocument();
});
