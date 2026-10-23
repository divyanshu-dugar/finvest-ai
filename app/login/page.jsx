'use client';

import { useState } from 'react';
import AuthLayout, { AuthLink } from '@/components/auth/AuthLayout';
import PasswordInput from '@/components/auth/PasswordInput';
import Button from '@/components/ui/Button';
import { Input, Label, FieldError } from '@/components/ui/Field';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ userName: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Sign in failed');
      login(data.token, data.displayName || data.userName, { onboarded: data.onboarded });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to continue your research."
      onGoogleError={setError}
      footer={<>New to Finvest AI? <AuthLink href="/register">Create an account</AuthLink></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="userName">Username</Label>
          <Input id="userName" name="userName" value={form.userName} onChange={handleChange} autoComplete="username" required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" name="password" value={form.password} onChange={handleChange} autoComplete="current-password" required />
        </div>
        <FieldError>{error}</FieldError>
        <Button type="submit" loading={loading} className="w-full">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
