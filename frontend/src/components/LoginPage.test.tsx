import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import LoginPage from './LoginPage';

const theme = createTheme();

const MockProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    <NotificationProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </NotificationProvider>
  </ThemeProvider>
);

describe('LoginPage', () => {
  test('renders login form', () => {
    render(
      <MockProviders>
        <LoginPage />
      </MockProviders>
    );

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('displays demo credentials', () => {
    render(
      <MockProviders>
        <LoginPage />
      </MockProviders>
    );

    expect(screen.getByText(/demo credentials/i)).toBeInTheDocument();
    expect(screen.getByText(/chinmaytechsoft@gmail.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Chinmay@123/i)).toBeInTheDocument();
  });

  test('shows error for invalid credentials', async () => {
    render(
      <MockProviders>
        <LoginPage />
      </MockProviders>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'invalid@email.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  test('shows loading state during login', async () => {
    render(
      <MockProviders>
        <LoginPage />
      </MockProviders>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Should show loading state
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('toggles password visibility', () => {
    render(
      <MockProviders>
        <LoginPage />
      </MockProviders>
    );

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const toggleButton = screen.getByLabelText(/toggle password visibility/i);

    // Initially password should be hidden
    expect(passwordInput.type).toBe('password');

    // Click to show password
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    // Click to hide password again
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });
});