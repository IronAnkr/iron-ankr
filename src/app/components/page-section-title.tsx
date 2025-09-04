import { cn } from "@/utils/cn";

export default function PageSectionTitle({title}:{title?:string}){
  return(
    <h3 className={cn("font-bold text-2xl text-center", "")}>
      {title}
    </h3>
  )
}
