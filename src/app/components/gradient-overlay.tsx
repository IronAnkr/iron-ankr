import { cn } from "@/utils/cn";
import { ReactNode } from "react";


export default function GradientOverlay({ className }:{className?:string, }){
  return (
    <div className={cn(!className && "bg-gradient-to-b from-black via-transparent to-black z-10 absolute inset-0 pointer-events-none")} />
  )
}
