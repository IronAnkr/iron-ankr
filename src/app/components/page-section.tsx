import { ReactNode } from "react";



export default function PageSection({ children }: {children?:ReactNode}){
  return(
    <section className="w-full h-fit py-8 bg-black grid place-content-center min-h-64">
      {children} 
    </section>
  )
}
