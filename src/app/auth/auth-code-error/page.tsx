import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="glass-dark p-12 rounded-3xl border border-white/5 text-center max-w-md">
        <h1 className="text-3xl font-bold text-white mb-4">Authentication Error</h1>
        <p className="text-zinc-500 mb-8">
          Something went wrong while trying to sign you in. The link might be expired or invalid.
        </p>
        <Link 
          href="/login" 
          className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-zinc-200 transition-all inline-block"
        >
          Back to Login
        </Link>
      </div>
    </div>
  )
}
