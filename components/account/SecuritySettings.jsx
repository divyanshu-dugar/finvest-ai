'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Clock } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';
import PasswordInput from '@/components/auth/PasswordInput';
import Button from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { FieldError, Input, Label } from '@/components/ui/Field';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/** Call an /api/me endpoint and return the updated profile, or throw with the API's message. */
async function callMe(path, method, body) {
  const res = await authenticatedFetch(`${API_URL}/api/me${path}`, {
    method,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || 'Something went wrong. Please try again.');
  return data;
}

function Row({ label, children, action }) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-[13px] text-muted">{label}</p>
        <div className="mt-1 text-sm text-ink">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function EmailSection({ account, onChange }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(null); // 'save' | 'resend' | 'cancel'
  const [error, setError] = useState('');

  const run = async (kind, request, success) => {
    setBusy(kind);
    setError('');
    try {
      await request();
      await onChange();
      if (success) toast.success(success);
      return true;
    } catch (err) {
      if (kind === 'save') setError(err.message);
      else toast.error(err.message);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const ok = await run(
      'save',
      () => callMe('/email', 'PUT', { email: form.email, password: form.password }),
      `We sent a confirmation link to ${form.email.trim()}.`,
    );
    if (ok) {
      setEditing(false);
      setForm({ email: '', password: '' });
    }
  };

  const close = () => {
    setEditing(false);
    setError('');
    setForm({ email: '', password: '' });
  };

  return (
    <>
      <Row
        label="Email"
        action={!editing && (
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            {account.email ? 'Change' : 'Add email'}
          </Button>
        )}
      >
        {account.email ? (
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="break-all">{account.email}</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-positive-soft px-1.5 py-0.5 text-[11px] font-medium text-positive">
              <CheckCircle2 className="size-3" /> Confirmed
            </span>
          </span>
        ) : (
          <span className="text-muted">No email yet. Add one so you can reset your password.</span>
        )}
      </Row>

      {account.pendingEmail && (
        <div className="mx-5 mb-4 flex flex-col gap-3 rounded-lg border border-warning/25 bg-warning-soft px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-2">
            <Clock className="mt-0.5 size-3.5 shrink-0 text-warning" />
            <span>
              Waiting for you to confirm <span className="font-medium text-ink">{account.pendingEmail}</span>. Check that inbox for our link.
            </span>
          </p>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="secondary"
              size="sm"
              loading={busy === 'resend'}
              onClick={() => run('resend', () => callMe('/email/resend', 'POST'), 'Sent a new link.')}
            >
              Resend
            </Button>
            <Button
              variant="ghost"
              size="sm"
              loading={busy === 'cancel'}
              onClick={() => run('cancel', () => callMe('/email/pending', 'DELETE'))}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {editing && (
        <form onSubmit={save} className="mx-5 mb-5 space-y-4 rounded-lg border border-line bg-subtle/50 p-4">
          <div>
            <Label htmlFor="new-email">{account.email ? 'New email' : 'Email'}</Label>
            <Input
              id="new-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              required
              autoFocus
            />
          </div>
          {account.hasPassword && (
            <div>
              <Label htmlFor="email-password" hint="to confirm it's you">Current password</Label>
              <PasswordInput
                id="email-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
                required
              />
            </div>
          )}
          <p className="text-xs leading-relaxed text-muted">
            We'll email a confirmation link to the new address.
            {account.email && ' Your current email stays in place until you click it.'}
          </p>
          <FieldError>{error}</FieldError>
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={busy === 'save'}>Send confirmation link</Button>
            <Button variant="ghost" size="sm" onClick={close}>Cancel</Button>
          </div>
        </form>
      )}
    </>
  );
}

function PasswordSection({ account, onChange }) {
  const [editing, setEditing] = useState(false);
  const empty = { currentPassword: '', newPassword: '', confirmPassword: '' };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const close = () => {
    setEditing(false);
    setError('');
    setForm(empty);
  };

  const save = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await callMe('/password', 'PUT', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      await onChange();
      toast.success(account.hasPassword ? 'Password changed.' : 'Password set. You can now sign in with it.');
      close();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Row
        label="Password"
        action={!editing && (
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            {account.hasPassword ? 'Change' : 'Set a password'}
          </Button>
        )}
      >
        {account.hasPassword ? (
          <span className="tracking-[0.2em] text-ink-2">••••••••</span>
        ) : (
          <span className="text-muted">You sign in with Google. Set a password to also sign in with your username.</span>
        )}
      </Row>

      {editing && (
        <form onSubmit={save} className="mx-5 mb-5 space-y-4 rounded-lg border border-line bg-subtle/50 p-4">
          {account.hasPassword && (
            <div>
              <Label htmlFor="currentPassword">Current password</Label>
              <PasswordInput id="currentPassword" name="currentPassword" value={form.currentPassword} onChange={update} autoComplete="current-password" required autoFocus />
            </div>
          )}
          <div>
            <Label htmlFor="newPassword">New password</Label>
            <PasswordInput id="newPassword" name="newPassword" value={form.newPassword} onChange={update} autoComplete="new-password" minLength={8} required autoFocus={!account.hasPassword} />
            <p className="mt-1.5 text-xs text-muted">At least 8 characters, with an uppercase letter, a lowercase letter and a number.</p>
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <PasswordInput id="confirmPassword" name="confirmPassword" value={form.confirmPassword} onChange={update} autoComplete="new-password" required />
          </div>
          <FieldError>{error}</FieldError>
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={saving}>{account.hasPassword ? 'Change password' : 'Set password'}</Button>
            <Button variant="ghost" size="sm" onClick={close}>Cancel</Button>
          </div>
        </form>
      )}
    </>
  );
}

/** Email and password management on the account page. */
export default function SecuritySettings({ account, onChange }) {
  return (
    <Card className="mt-6">
      <CardHeader title="Sign-in and security" description="Your email is used for password resets and important account notices." />
      <div className="divide-y divide-line">
        <div><EmailSection account={account} onChange={onChange} /></div>
        <div><PasswordSection account={account} onChange={onChange} /></div>
      </div>
    </Card>
  );
}
