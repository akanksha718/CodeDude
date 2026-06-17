import React from 'react'
import {SignUp} from '@clerk/nextjs'
const SignUpPage = () => {
  return (
    <div>
      <SignUp
        fallbackRedirectUrl="/dashboard"
        signInFallbackRedirectUrl="/sign-in"
      />
    </div>
  )
}

export default SignUpPage;
