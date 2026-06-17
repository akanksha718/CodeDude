import React from 'react'
import {SignIn} from '@clerk/nextjs'
const SignInPage = () => {
  return (
    <div>
      <SignIn
        fallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/sign-up"
      />
    </div>
  )
}

export default SignInPage;
