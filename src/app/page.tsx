import { AnnouncementBar } from '@/components/landing/AnnouncementBar'
import { Navbar } from '@/components/landing/Navbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { StatsSection } from '@/components/landing/StatsSection'
import { FeatureGrid } from '@/components/landing/FeatureGrid'
import { BenefitsSection } from '@/components/landing/BenefitsSection'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Testimonials } from '@/components/landing/Testimonials'
import { FaqSection } from '@/components/landing/FaqSection'
import { Footer } from '@/components/landing/Footer'

export default function HomePage() {
  return (
    <>
      {/* <AnnouncementBar /> */}
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <FeatureGrid />
        <BenefitsSection />
        <HowItWorks />
        <Testimonials />
        <FaqSection />
      </main>
      <Footer />
    </>
  )
}
