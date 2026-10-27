"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
export function ThemeToggle() {
 const [dark,setDark] = useState(false);
 useEffect(()=>{setDark(document.documentElement.dataset.theme==="dark");},[]);
 function change() {const next=!dark;setDark(next);document.documentElement.dataset.theme=next?"dark":"light";try{localStorage.setItem("nsukart-theme",next?"dark":"light")}catch{}}
 return <button type="button" onClick={change} className="theme-toggle" aria-label={dark?"Switch to light mode":"Switch to dark mode"} title={dark?"Light mode":"Dark mode"}>{dark?<Sun size={20}/>:<Moon size={20}/>}</button>;
}
