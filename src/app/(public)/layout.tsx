import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

