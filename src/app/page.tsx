'use client';
import CallToAction from "@/components/home/cta";
import Features from "@/components/home/Features";
import Footer from "@/components/home/footer";
import Hero from "@/components/home/Hero";
import Navbar from "@/components/home/Navbar";
import ResourceLibrary from "@/components/home/ResourceLibrary";
import Testimonials from "@/components/home/Testimonials";
import FinancialManagementUI from "@/components/home/WhyUs";


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
