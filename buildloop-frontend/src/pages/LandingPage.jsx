import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignIn, useAuth, useSignUp } from '@clerk/clerk-react';
import { Eye, EyeOff, Play, ArrowRight, Loader2 } from 'lucide-react';

const LOGO_URL = '/buildloop_logo_black.png';

const FEATURE_PILLS = ['AI Insights', 'Kanban Board', 'Team Workspace'];

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}

function DashboardPreview() {
  return (
    <div className="w-full max-w-lg mx-auto rounded-2xl overflow-hidden bg-[#0f1117] shadow-2xl border border-white/10">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3 bg-[#1a1d23] border-b border-white/10">
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <span className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-3 text-white/30 text-xs font-mono">buildloop.app/dashboard</span>
      </div>
      {/* Mock UI */}
      <div className="p-4">
        <div className="flex gap-3">
          {/* sidebar */}
          <div className="w-32 shrink-0 space-y-1.5">
            {['Dashboard', 'Feedback', 'Insights', 'Features', 'Kanban'].map((item, i) => (
              <div
                key={item}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium ${i === 0 ? 'bg-white/15 text-white' : 'text-white/40'
                  }`}
              >
                {item}
              </div>
            ))}
          </div>
          {/* content */}
          <div className="flex-1 space-y-2.5">
            <div className="h-2 bg-white/20 rounded-full w-2/3" />
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-2.5 space-y-1.5">
                  <div className="h-1.5 bg-white/20 rounded-full w-1/2" />
                  <div className="h-4 bg-white/20 rounded-full w-3/4" />
                  <div className="h-1.5 bg-white/10 rounded-full w-full" />
                </div>
              ))}
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 space-y-1.5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60 shrink-0" />
                  <div className="h-1.5 bg-white/20 rounded-full flex-1" />
                  <div className="h-1.5 bg-white/10 rounded-full w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();
  const { signIn, isLoaded: signInLoaded } = useSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [videoPlaying, setVideoPlaying] = useState(false);

  // Sign up state
  const [isSignUp, setIsSignUp] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const { isLoaded: signUpLoaded, signUp, setActive } = useSignUp();

  // Redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!signInLoaded) return;

    setError('');
    setIsSubmitting(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Sign in failed. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!signUpLoaded) return;
    setError('');
    setIsSubmitting(true);
    try {
      await signUp.create({
        emailAddress: email,
        password,
      });
      // Send the email code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Sign up failed. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!signUpLoaded) return;
    setError('');
    setIsSubmitting(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });
      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        navigate('/dashboard', { replace: true });
      } else {
        console.log(completeSignUp);
      }
    } catch (err) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Verification failed. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!signInLoaded) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex overflow-hidden font-sans">
      {/* ─── LEFT COLUMN ─── */}
      <div className="hidden lg:flex flex-col w-1/2 bg-white border-r border-gray-100 px-12 py-10 relative">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-auto">
          <img src={LOGO_URL} alt="BuildLoop" className="h-12 w-auto" />
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center py-12 gap-8">
          {/* Video / Preview Card */}
          <div className="relative w-full max-w-lg group cursor-pointer" onClick={() => setVideoPlaying(!videoPlaying)}>
            <DashboardPreview />
            {/* Play overlay */}
            {!videoPlaying && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30 backdrop-blur-[2px]">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-5 h-5 text-[#1a1d23] ml-1" fill="currentColor" />
                </div>
              </div>
            )}
          </div>

          {/* Tagline */}
          <div className="text-center max-w-md">
            <p className="text-[#2d3435] text-lg font-semibold leading-snug tracking-tight">
              Turn user feedback into product decisions —{' '}
              <span className="text-[#5a6061]">automatically.</span>
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {FEATURE_PILLS.map((pill) => (
              <span
                key={pill}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium text-[#5a6061] border border-[#adb3b4]/40 bg-[#f2f4f4]"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <p className="text-xs text-[#adb3b4] text-center mt-auto">
          Trusted by product teams shipping faster
        </p>
      </div>

      {/* ─── RIGHT COLUMN ─── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-full bg-[#1a1d23] flex items-center justify-center">
            <span className="text-white text-xs font-semibold tracking-tight">BL</span>
          </div>
          <img src={LOGO_URL} alt="BuildLoop" className="h-5 w-auto" />
        </div>

          {pendingVerification ? (
            <div className="w-full max-w-[400px]">
              {/* Heading */}
              <div className="mb-8">
                <h1 className="text-[28px] font-semibold text-[#2d3435] leading-tight mb-1.5">
                  Verify your email
                </h1>
                <p className="text-sm text-[#5a6061]">We sent a code to {email}</p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="code" className="block text-xs font-medium text-[#2d3435] uppercase tracking-[0.05em]">
                    Verification Code
                  </label>
                  <input
                    id="code"
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-3 rounded-xl border border-[#adb3b4]/40 bg-[#f2f4f4] text-sm text-[#2d3435] placeholder:text-[#adb3b4] focus:outline-none focus:border-[#1a1d23]/40 focus:bg-[#dde4e5]/40 transition-colors"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-full bg-[#1a1d23] hover:bg-[#2d3435] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    'Verify Email'
                  )}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setPendingVerification(false)}
                  className="w-full py-3 rounded-full bg-white border border-[#adb3b4]/40 hover:border-[#757c7d]/40 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-[#2d3435] text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2.5 mt-3"
                >
                  Back to Sign Up
                </button>
              </form>
            </div>
          ) : (
            <div className="w-full max-w-[400px]">
              {/* Heading */}
              <div className="mb-8">
                <h1 className="text-[28px] font-semibold text-[#2d3435] leading-tight mb-1.5">
                  {isSignUp ? 'Create an account' : 'Welcome back'}
                </h1>
                <p className="text-sm text-[#5a6061]">
                  {isSignUp ? 'Sign up to get started with BuildLoop' : 'Sign in to your BuildLoop account'}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-medium text-[#2d3435] uppercase tracking-[0.05em]">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-4 py-3 rounded-xl border border-[#adb3b4]/40 bg-[#f2f4f4] text-sm text-[#2d3435] placeholder:text-[#adb3b4] focus:outline-none focus:border-[#1a1d23]/40 focus:bg-[#dde4e5]/40 transition-colors"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-xs font-medium text-[#2d3435] uppercase tracking-[0.05em]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-11 rounded-xl border border-[#adb3b4]/40 bg-[#f2f4f4] text-sm text-[#2d3435] placeholder:text-[#adb3b4] focus:outline-none focus:border-[#1a1d23]/40 focus:bg-[#dde4e5]/40 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#adb3b4] hover:text-[#5a6061] transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sign In/Up button */}
                <button
                  id="sign-in-submit"
                  type="submit"
                  disabled={isSubmitting || (isSignUp ? !signUpLoaded : !signInLoaded)}
                  className="w-full py-3 rounded-full bg-[#1a1d23] hover:bg-[#2d3435] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isSignUp ? 'Signing up…' : 'Signing in…'}
                    </>
                  ) : (
                    isSignUp ? 'Sign Up' : 'Sign In'
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-[#adb3b4]/30" />
                <span className="text-xs text-[#adb3b4] font-medium">or</span>
                <div className="flex-1 h-px bg-[#adb3b4]/30" />
              </div>

              {/* Google */}
              <button
                id="sign-in-google"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={!signInLoaded}
                className="w-full py-3 rounded-full bg-white border border-[#adb3b4]/40 hover:border-[#757c7d]/40 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-[#2d3435] text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2.5"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              {/* Toggle Account Mode */}
              <div className="mt-6 text-center text-sm text-[#5a6061]">
                {isSignUp ? (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(false);
                        setError('');
                      }}
                      className="text-[#1a1d23] font-semibold hover:underline focus:outline-none"
                    >
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(true);
                        setError('');
                      }}
                      className="text-[#1a1d23] font-semibold hover:underline focus:outline-none"
                    >
                      Sign up
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
