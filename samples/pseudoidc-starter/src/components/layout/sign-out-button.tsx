"use client"
import { signOut } from '@/lib/auth/authClient'
import React from 'react'
import { redirect } from 'next/navigation'
import { useState } from 'react';

const SignOutButton = () => {

    const [isLoading, setIsLoading] = useState(false);

    const handleSignOut = async () => {
        setIsLoading(true);
        await signOut();            
        setIsLoading(false);
        redirect('/login');
    }
  return (
    <button onClick={handleSignOut} disabled={isLoading} className='bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 cursor-pointer mt-4'>{isLoading ? 'Signing Out...' : 'Sign Out'}</button>
  )
}

export default SignOutButton