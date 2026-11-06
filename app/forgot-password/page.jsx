'use client';

import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import AuthLayout, { AuthLink } from '@/components/auth/AuthLayout';
import Button from '@/components/ui/Button';
import { Input, Label, FieldError } from '@/components/ui/Field';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Something went wrong. Please try again.');
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter the email on your account and we'll send you a link to choose a new password."
      showGoogle={false}
      footer={<>Remembered it? <AuthLink href="/login">Back to sign in</AuthLink></>}
    >
      {sent ? (
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-brand-soft">
            <MailCheck className="size-5 text-brand" />
          </div>
          <p className="text-sm font-medium text-ink">Check your inbox</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            If an account uses <span className="font-medium text-ink-2">{email.trim()}</span>, a reset link is on its way.
            It expires in 1 hour. If nothing arrives in a few minutes, check your spam folder.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
              autoComplete="email"
              required
            />
            <p className="mt-1.5 text-xs text-muted">Signed up without an email? Sign in with Google, or contact us.</p>
          </div>
          <FieldError>{error}</FieldError>
          <Button type="submit" loading={loading} className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
