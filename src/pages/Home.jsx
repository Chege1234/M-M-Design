import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import ProjectsSection from '../components/ProjectsSection';
import AboutSection from '../components/AboutSection';
import ServicesSection from '../components/ServicesSection';
import ContactSection from '../components/ContactSection';
import Footer from '../components/Footer';
import StudioLiaisonChat from '../components/StudioLiaisonChat';

export default function Home() {
  return (
    <main className="min-h-screen bg-ink text-linen overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <ProjectsSection />
      <AboutSection />
      <ServicesSection />
      <ContactSection />
      <Footer />
      <StudioLiaisonChat />
    </main>
  );
}
