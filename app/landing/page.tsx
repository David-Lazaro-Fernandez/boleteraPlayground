"use client"
import { 
  Header, 
  HeroSection, 
  UpcomingEventsSection, 
  CallToActionSection, 
  Footer 
} from "@/components/landing"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <HeroSection />
      <UpcomingEventsSection />
      <CallToActionSection />
      <Footer />
    </div>
  )
}
