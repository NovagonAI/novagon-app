import { HeadModels } from '@/components/landing/HeadModels'
import { Landing } from '@/components/landing/Landing'
import { MeetTheTeam } from '@/components/landing/MeetTheTeam'
import { AboutSection, BrandsSection, Footer, ServiceSection } from '@/components/landing/Sections'

export default function HomePage() {
  return (
    <>
      <Landing />
      <ServiceSection />
      <AboutSection />
      <BrandsSection />
      <HeadModels />
      <MeetTheTeam />
      <Footer />
    </>
  )
}
