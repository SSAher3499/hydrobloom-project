import express from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { sendOtpEmail } from '../services/email.service';
import jwt from 'jsonwebtoken';

const router = express.Router();
const reqLimiter = rateLimit({ windowMs: 60_000, max: 3 });
const verifyLimiter = rateLimit({
  windowMs: 15 * 60_000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many verification attempts, please try again later'
});

const hash = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const genOtp = (len = 6) =>
  Array.from(crypto.randomBytes(len)).map(b => (b % 10).toString()).join('').slice(0, len);

router.post('/auth/request-email-otp', reqLimiter, async (req, res) => {
  const { email } = req.body as { email?: string };
  const msg = { ok: true }; // uniform response

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.json(msg);

  const emailLower = email.toLowerCase();
  const code = genOtp(6);

  // Invalidate existing active OTPs for this email and create new one in transaction
  await prisma.$transaction(async (tx) => {
    // Invalidate all unused, unexpired OTPs for this email
    await tx.emailOtp.updateMany({
      where: {
        email: emailLower,
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      data: { usedAt: new Date() } // Mark as used to invalidate
    });

    // Create new OTP
    await tx.emailOtp.create({
      data: {
        email: emailLower,
        otpHash: hash(code),
        expiresAt: new Date(Date.now() + 10 * 60_000)
      }
    });
  });

  try { await sendOtpEmail(email, code); } catch {}

  return res.json(msg);
});

router.post('/auth/verify-email-otp', verifyLimiter, async (req, res) => {
  const { email, code } = req.body as { email?: string; code?: string };
  const bad = () => res.status(400).json({ ok: false, message: 'Invalid or expired code' });
  if (!email || !code) return bad();

  const record = await prisma.emailOtp.findFirst({
    where: { email: email.toLowerCase(), usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' }
  });
  if (!record) return bad();
  if (record.attempts >= 5) return bad();

  if (record.otpHash !== hash(String(code))) {
    await prisma.emailOtp.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return bad();
  }

  await prisma.emailOtp.update({ where: { id: record.id }, data: { usedAt: new Date() } });

  // Create user on first sign-in after successful OTP verification
  const emailLower = email.toLowerCase();
  await prisma.user.upsert({
    where: { email: emailLower },
    create: { email: emailLower, name: email.split('@')[0] },
    update: {}
  });

  // Issue JWT if you already use one; otherwise just return ok.
  const secret = process.env.JWT_SECRET;
  if (secret) {
    const token = jwt.sign({ sub: emailLower }, secret, { expiresIn: '7d' });
    res.cookie('session', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7*24*3600*1000 });
    return res.json({ ok: true, tokenIssued: true });
  }
  return res.json({ ok: true });
});

export default router;
