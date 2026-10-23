'use client';

import { useState } from 'react';
import AuthLayout, { AuthLink } from '@/components/auth/AuthLayout';
import PasswordInput from '@/components/auth/PasswordInput';
import Button from '@/components/ui/Button';
import { Input, Label, FieldError } from '@/components/ui/Field';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ userName: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: form.userName, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not create your account');
      login(data.token, data.userName, { onboarded: false });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      description="Start researching public companies in minutes."
      onGoogleError={setError}
      footer={<>Already have an account? <AuthLink href="/login">Sign in</AuthLink></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="userName">Username</Label>
          <Input
            id="userName"
            name="userName"
            value={form.userName}
            onChange={handleChange}
            autoComplete="username"
            minLength={3}
            maxLength={30}
            pattern="[A-Za-z0-9_]+"
            title="Letters, numbers and underscores only"
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <p className="mt-1.5 text-xs text-muted">At least 8 characters, with an uppercase letter, a lowercase letter and a number.</p>
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
        </div>
        <FieldError>{error}</FieldError>
        <Button type="submit" loading={loading} className="w-full">
          Create account
        </Button>
        <p className="text-center text-xs leading-relaxed text-muted">
          By creating an account you agree to the <AuthLink href="/terms">Terms</AuthLink> and{' '}
          <AuthLink href="/privacy">Privacy policy</AuthLink>.
        </p>
      </form>
    </AuthLayout>
  );
}
