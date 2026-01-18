
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = createClient()

  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: 'Username and password are required.' }
  }

  // 1. Email Lookup from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email')
    .eq('username', username)
    .single()

  if (profileError || !profile) {
    return { error: 'Invalid username or password.' }
  }

  // 2. Sign in with Supabase Auth using the found email
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  })

  if (signInError) {
    return { error: 'Invalid username or password.' }
  }
  
  revalidatePath('/', 'layout')
  redirect('/') // Middleware will handle redirect to /mobile or /desktop
}
