"use client";
import Link from "next/link";
import { useEffect } from "react";
export default function DashboardError({error,reset}:{error:Error & {digest?:string};reset:()=>void}) {
  useEffect(()=>{ console.error("Dashboard rendering failed", error); },[error]);
  return <main id="main" className="container section narrow"><div className="panel">
    <h1>We couldn't load your dashboard.</h1>
    <p>Your account and orders have not been changed. Please retry. If this continues, contact NSUKart support.</p>
    <button type="button" className="btn" onClick={()=>reset()}>Retry dashboard</button>
    <p><Link href="/marketplace">Return to marketplace</Link></p>
    {error.digest && <small>Support reference: {error.digest}</small>}
  </div></main>;
}
