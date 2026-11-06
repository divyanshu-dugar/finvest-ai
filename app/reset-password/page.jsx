'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import AuthLayout, { AuthLink } from '@/components/auth/AuthLayout';
import PasswordInput from '@/components/auth/PasswordInput';
import Button from '@/components/ui/Button';
import { Label, FieldError } from '@/components/ui/Field';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Read the token after mount, so the page can be served statically.
  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') || '');
  }, []);

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Could not reset your password');
      toast.success(`Password updated. Sign in as ${data.userName}.`);
      router.replace(`/login?userName=${encodeURIComponent(data.userName)}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const missingToken = token === '';

  return (
    <AuthLayout
      title="Choose a new password"
      description={missingToken ? 'This link is missing its code.' : 'Pick something you haven’t used here before.'}
      showGoogle={false}
      footer={<>Need a new link? <AuthLink href="/forgot-password">Request another</AuthLink></>}
    >
      {missingToken ? (
        <FieldError>This reset link is incomplete. Copy the whole link from the email, or request a new one.</FieldError>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">New password</Label>
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
            <Label htmlFor="confirmPassword">Confirm new password</Label>
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
          <Button type="submit" loading={loading} disabled={token === null} className="w-full">
            Update password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
