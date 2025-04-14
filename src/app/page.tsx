'use client';
import CallToAction from "@/lib/home/cta";
import Features from "@/lib/home/Features";
import Footer from "@/lib/home/footer";
import Hero from "@/lib/home/Hero";
import Navbar from "@/lib/home/Navbar";
import ResourceLibrary from "@/lib/home/ResourceLibrary";
import Testimonials from "@/lib/home/Testimonials";
import FinancialManagementUI from "@/lib/home/WhyUs";


const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <FinancialManagementUI />
        <Testimonials />
        <ResourceLibrary />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default App;
