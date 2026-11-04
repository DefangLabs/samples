import SignOutButton from '@/components/layout/sign-out-button';
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

const ProtectedPage = async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) {
        redirect('/login');
    }
    return (
        <div className='flex flex-col items-center justify-center h-screen'>
            <h1 className='text-2xl font-bold'>Protected Page</h1>
            <p className='text-gray-500'>Welcome {session.user.name}</p>
            <p className='text-gray-500'>Email: {session.user.email}</p>
            <p className='text-gray-500'>ID: {session.user.id}</p>
        
            <SignOutButton />
        </div>
    )
}

export default ProtectedPage