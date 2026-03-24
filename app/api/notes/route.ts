import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  const db = supabase()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  try {
    if (id) {
      const { data, error } = await db
        .from('note_sessions')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return NextResponse.json({ session: data })
    }
    const { data, error } = await db
      .from('note_sessions')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ sessions: data || [] })
  } catch (err) {
    // If table doesn't exist, return empty gracefully
    return NextResponse.json({ sessions: [], session: null })
  }
}

export async function POST(request: Request) {
  const db = supabase()
  try {
    const body = await request.json()
    const { id, title, content, created_at, updated_at } = body
    const { error } = await db.from('note_sessions').upsert({
      id,
      title: title || 'Untitled Session',
      content: content || [],
      created_at: created_at || new Date().toISOString(),
      updated_at: updated_at || new Date().toISOString(),
    }, { onConflict: 'id' })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save note session' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const db = supabase()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  try {
    const { error } = await db.from('note_sessions').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete note session' }, { status: 500 })
  }
}
