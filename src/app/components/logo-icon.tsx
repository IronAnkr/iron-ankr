import Image from "next/image";
import Link from "next/link";


export default function LogoIcon(){
  return(
        <Link href="/" className="flex items-center gap-2 z-20 ">
          <Image className=" invert dark:invert-0" alt="logo" src="/logo.png" width={30} height={30} />
          <span className="text-sm font-semibold tracking-wide text-foreground/90 sm:block uppercase">IRON ANKR</span>
        </Link>
  )
}
