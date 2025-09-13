import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="system-theme bg-background text-foreground min-h-screen">
      <Navbar />
      <main className="pt-24">
        {children}
      </main>
      <Footer />
    </div>
  );
}
