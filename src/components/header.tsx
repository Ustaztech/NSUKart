import Link from "next/link";
import {
  ShoppingBag,
  Search,
  UserRound,
  Menu,
  House,
  Grid2X2,
  Package,
} from "lucide-react";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
export function Header() {
  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <Brand />
          <form action="/marketplace" className="search">
            <Search size={19} />
            <input
              name="q"
              aria-label="Search products"
              placeholder="Search textbooks, gadgets, fashion…"
            />
            <button aria-label="Search">
              <Search size={18} />
            </button>
          </form>
          <ThemeToggle />
          <nav className="header-nav" aria-label="Main navigation">
            <Link href="/stores">Stores</Link>
            <Link href="/vendor/apply">Start selling</Link>
            <Link href="/dashboard" aria-label="My account">
              <UserRound size={21} />
            </Link>
            <Link href="/cart" aria-label="Shopping cart">
              <ShoppingBag size={21} />
            </Link>
            <Link
              className="mobile-menu"
              href="/marketplace"
              aria-label="Browse marketplace"
            >
              <Menu />
            </Link>
          </nav>
        </div>
      </header>
      <nav className="mobile-bottom" aria-label="Mobile navigation">
        <Link href="/">
          <House size={20} />
          Home
        </Link>
        <Link href="/marketplace">
          <Grid2X2 size={20} />
          Explore
        </Link>
        <Link href="/cart">
          <ShoppingBag size={20} />
          Cart
        </Link>
        <Link href="/dashboard/orders">
          <Package size={20} />
          Orders
        </Link>
        <Link href="/dashboard">
          <UserRound size={20} />
          Account
        </Link>
      </nav>
    </>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Brand />
          <p>Your Campus. Your Marketplace.</p>
          <small>An independent marketplace for the NSUK community.</small>
        </div>
        <div>
          <h3>Explore</h3>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/stores">Student stores</Link>
          <Link href="/vendor/apply">Become a vendor</Link>
        </div>
        <div>
          <h3>Support</h3>
          <Link href="/help">Help centre</Link>
          <Link href="/policies/privacy">Privacy</Link>
          <Link href="/policies/terms">Terms & refunds</Link>
        </div>
      </div>
    </footer>
  );
}
