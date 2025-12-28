import Navbar from "@/components/Navbar";
import AnniversaryWidget from "@/components/AnniversaryWidget";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="pt-20 pb-10 md:pb-10 pb-24 min-h-screen">
        {children}
      </main>
      {/* 纪念日浮动挂件 */}
      <AnniversaryWidget />
    </>
  );
}

