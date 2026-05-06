import { supabase } from './supabase'
import { resizeImageToBlob } from './imageResize'

const BUCKET = 'workout-photos'

export interface WorkoutPhoto {
  id: string
  workout_id: string
  user_id: string
  storage_path: string
  public_url: string
  created_at: string
}

export interface PhotoReaction {
  id: string
  photo_id: string
  user_id: string
  reaction: 'heart' | 'flame'
  created_at: string
}

export interface PhotoComment {
  id: string
  photo_id: string
  user_id: string
  body: string
  created_at: string
}

export interface PhotoBundle {
  photo: WorkoutPhoto
  reactions: PhotoReaction[]
  comments: PhotoComment[]
}

export async function uploadWorkoutPhoto(file: File, userId: string, workoutId: string) {
  const blob = await resizeImageToBlob(file, 1080, 0.85)
  const filename = `${crypto.randomUUID()}.jpg`
  const path = `${userId}/${workoutId}/${filename}`

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  if (upErr) throw upErr

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const publicUrl = pub.publicUrl

  const { data, error } = await supabase
    .from('workout_photos')
    .insert({
      workout_id: workoutId,
      user_id: userId,
      storage_path: path,
      public_url: publicUrl,
    })
    .select()
    .single()

  if (error) {
    // best-effort cleanup if the insert fails
    await supabase.storage.from(BUCKET).remove([path])
    throw error
  }

  return data as WorkoutPhoto
}

export async function deleteWorkoutPhoto(photo: WorkoutPhoto) {
  await supabase.storage.from(BUCKET).remove([photo.storage_path])
  return supabase.from('workout_photos').delete().eq('id', photo.id)
}

export async function loadPhotosForWorkouts(workoutIds: string[]): Promise<Record<string, WorkoutPhoto[]>> {
  if (workoutIds.length === 0) return {}
  const { data } = await supabase
    .from('workout_photos')
    .select('*')
    .in('workout_id', workoutIds)
    .order('created_at', { ascending: true })
  const out: Record<string, WorkoutPhoto[]> = {}
  for (const p of (data ?? []) as WorkoutPhoto[]) {
    ;(out[p.workout_id] ??= []).push(p)
  }
  return out
}

export async function loadReactionsForPhotos(photoIds: string[]): Promise<Record<string, PhotoReaction[]>> {
  if (photoIds.length === 0) return {}
  const { data } = await supabase
    .from('photo_reactions')
    .select('*')
    .in('photo_id', photoIds)
  const out: Record<string, PhotoReaction[]> = {}
  for (const r of (data ?? []) as PhotoReaction[]) {
    ;(out[r.photo_id] ??= []).push(r)
  }
  return out
}

export async function loadCommentsForPhotos(photoIds: string[]): Promise<Record<string, PhotoComment[]>> {
  if (photoIds.length === 0) return {}
  const { data } = await supabase
    .from('photo_comments')
    .select('*')
    .in('photo_id', photoIds)
    .order('created_at', { ascending: true })
  const out: Record<string, PhotoComment[]> = {}
  for (const c of (data ?? []) as PhotoComment[]) {
    ;(out[c.photo_id] ??= []).push(c)
  }
  return out
}

export async function toggleReaction(
  photoId: string,
  userId: string,
  reaction: 'heart' | 'flame',
  current: PhotoReaction[]
) {
  const existing = current.find((r) => r.photo_id === photoId && r.user_id === userId && r.reaction === reaction)
  if (existing) {
    return supabase.from('photo_reactions').delete().eq('id', existing.id)
  }
  return supabase
    .from('photo_reactions')
    .insert({ photo_id: photoId, user_id: userId, reaction })
}

export async function addComment(photoId: string, userId: string, body: string) {
  const trimmed = body.trim()
  if (!trimmed) return null
  const { data, error } = await supabase
    .from('photo_comments')
    .insert({ photo_id: photoId, user_id: userId, body: trimmed.slice(0, 500) })
    .select()
    .single()
  if (error) throw error
  return data as PhotoComment
}

export async function deleteComment(commentId: string) {
  return supabase.from('photo_comments').delete().eq('id', commentId)
}
