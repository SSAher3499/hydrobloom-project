import React, { useState } from 'react';

export default function LoginEmail() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/auth/request-email-otp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    setSent(true);
    setMsg('If the email exists, we sent a code.');
  };

  if (sent) return <OtpVerify email={email} />;

  return (
    <form onSubmit={onSend} className="max-w-sm mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder="you@example.com"
        className="input input-bordered w-full" required />
      <button className="btn btn-primary w-full" type="submit">Send code</button>
      {msg && <p className="text-sm opacity-70">{msg}</p>}
    </form>
  );
}

function OtpVerify({ email }: { email: string }) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      if (res.ok) {
        // If backend issues cookie JWT, just redirect
        window.location.href = '/dashboard';
      } else {
        // Try to parse error message from response
        try {
          const data = await res.json();
          setErr(data.message || 'Invalid or expired code');
        } catch {
          setErr('Invalid or expired code');
        }
      }
    } catch (error) {
      setErr('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onVerify} className="max-w-sm mx-auto p-6 space-y-4">
      <h2 className="text-xl font-semibold">Enter 6-digit code</h2>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        className="input input-bordered w-full tracking-widest text-center text-xl"
        placeholder=""
        required
        disabled={loading}
      />
      <button
        className="btn btn-primary w-full"
        type="submit"
        disabled={loading}
      >
        {loading ? 'Verifying...' : 'Verify'}
      </button>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <p className="text-sm opacity-70">We sent a code to {email}</p>
    </form>
  );
}
