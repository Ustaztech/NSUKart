import Link from "next/link";
import { Brand } from "./brand";
import { Button } from "./ui/button";
import { login, signup, resetPassword, updatePassword } from "@/app/actions";
export function AuthForm({
  mode,
  error,
  message,
}: {
  mode: "login" | "signup" | "reset" | "update";
  error?: string;
  message?: string;
}) {
  const title = {
    login: "Welcome back.",
    signup: "Your campus connection starts here.",
    reset: "Forgot your password?",
    update: "Choose a new password.",
  }[mode];
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Brand light />
        <div>
          <span className="eyebrow">YOUR CAMPUS. YOUR MARKETPLACE.</span>
          <h2>
            A marketplace
            <br />
            with a familiar
            <br />
            <span>connection.</span>
          </h2>
          <p>
            Find your next great deal. Support a student business. Make campus
            life a little easier.
          </p>
          <div className="auth-art">
            N<span>BUY. SELL. BELONG.</span>
          </div>
        </div>
        <small>Independent. Community-focused. Made for NSUK.</small>
      </aside>
      <main id="main" className="auth-main">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        <div className="auth-form">
          <Link href="/" className="back-link">
            ← Back to marketplace
          </Link>
          <h1>{title}</h1>
          <p>
            {mode === "signup"
              ? "Create an account to shop and apply to sell."
              : mode === "reset"
                ? "We’ll email you a secure password reset link."
                : "Sign in to continue your NSUKart journey."}
          </p>
          {error && (
            <p role="alert" className="notice error">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="notice">
              {message}
            </p>
          )}
          <form
            action={
              { login, signup, reset: resetPassword, update: updatePassword }[
                mode
              ]
            }
          >
            {mode === "signup" && (
              <>
                <label>
                  Full name
                  <input
                    name="full_name"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={120}
                  />
                </label>
              </>
            )}
            {mode !== "update" && (
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </label>
            )}
            {mode === "signup" && (
              <>
                <label>
                  Phone number
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="08012345678"
                    required
                  />
                </label>
                <label>
                  Matriculation number
                  <input
                    name="matric_number"
                    placeholder="Your matriculation number"
                    required
                    minLength={5}
                  />
                </label>
              </>
            )}
            {mode !== "reset" && (
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  minLength={mode === "login" ? 1 : 12}
                  maxLength={128}
                  required
                />
                <small>
                  {mode !== "login" ? "At least 12 characters." : ""}
                </small>
              </label>
            )}
            {mode === "signup" && (
              <label className="checkbox-label">
                <input type="checkbox" name="terms" required />I agree to the{" "}
                <Link href="/policies/terms">terms</Link> and{" "}
                <Link href="/policies/privacy">privacy policy</Link>.
              </label>
            )}
            {mode === "login" && (
              <Link className="forgot" href="/reset-password">
                Forgot password?
              </Link>
            )}
            <Button type="submit">
              {
                {
                  login: "Sign in",
                  signup: "Create account",
                  reset: "Send reset link",
                  update: "Update password",
                }[mode]
              }{" "}
              →
            </Button>
          </form>
          <div className="auth-switch">
            {mode === "login" ? (
              <>
                New to NSUKart? <Link href="/signup">Create an account</Link>
              </>
            ) : (
              <>
                Already have an account? <Link href="/login">Sign in</Link>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
