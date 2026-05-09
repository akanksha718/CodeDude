import React from 'react'
import { Navbar, Hero } from '@/components/landing'
const LandingPage = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Navbar />
      <Hero />
    </div>
  )
}

export default LandingPage
