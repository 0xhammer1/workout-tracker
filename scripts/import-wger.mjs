#!/usr/bin/env node
// Import exercises from wger.de into your Supabase `exercises` table.
//
// Usage:
//   1. Run the SQL in supabase-migration-wger.sql in your Supabase SQL Editor.
//   2. From the project root: `node scripts/import-wger.mjs`
//
// Idempotent — re-running will update existing rows, not duplicate them.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// --- Load .env.local manually (avoiding extra deps) ---
const envPath = resolve(process.cwd(), '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env vars in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// --- Map wger muscle name → our MuscleGroup ---
const MUSCLE_MAP = {
  'Biceps brachii': 'biceps',
  'Brachialis': 'biceps',
  'Anterior deltoid': 'shoulders',
  'Serratus anterior': 'chest',
  'Pectoralis major': 'chest',
  'Triceps brachii': 'triceps',
  'Rectus abdominis': 'core',
  'Gastrocnemius': 'legs',
  'Gluteus maximus': 'glutes',
  'Trapezius': 'back',
  'Quadriceps femoris': 'legs',
  'Biceps femoris': 'legs',
  'Latissimus dorsi': 'back',
  'Obliquus externus abdominis': 'core',
  'Soleus': 'legs',
}

// --- Map wger category name → our MuscleGroup (used as fallback) ---
const CATEGORY_MAP = {
  Abs: 'core',
  Arms: 'biceps',
  Back: 'back',
  Calves: 'legs',
  Chest: 'chest',
  Legs: 'legs',
  Shoulders: 'shoulders',
}

// Map a primary muscle (or fallback to category) to our MuscleGroup
function mapPrimaryGroup(muscles, categoryName) {
  if (Array.isArray(muscles)) {
    for (const m of muscles) {
      const name = m?.name_en || m?.name
      if (name && MUSCLE_MAP[name]) return MUSCLE_MAP[name]
    }
  }
  if (categoryName && CATEGORY_MAP[categoryName]) return CATEGORY_MAP[categoryName]
  return 'other'
}

function mapAllGroups(muscles) {
  if (!Array.isArray(muscles)) return []
  const groups = new Set()
  for (const m of muscles) {
    const name = m?.name_en || m?.name
    if (name && MUSCLE_MAP[name]) groups.add(MUSCLE_MAP[name])
  }
  return Array.from(groups)
}

// --- Fetch all exercises from wger ---
async function fetchAllExercises() {
  let url = 'https://wger.de/api/v2/exerciseinfo/?language=2&limit=200'
  const all = []
  while (url) {
    process.stdout.write(`Fetching ${url}\n`)
    const r = await fetch(url, { headers: { 'User-Agent': 'lift-labs-import/1.0' } })
    if (!r.ok) throw new Error(`wger ${r.status}: ${await r.text()}`)
    const json = await r.json()
    all.push(...(json.results ?? []))
    url = json.next
  }
  return all
}

function pickEnglishTranslation(ex) {
  // language id 2 = English in wger
  const t = (ex.translations || []).find((x) => x.language === 2) || (ex.translations || [])[0]
  return t || null
}

function stripHtml(s) {
  if (!s) return null
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim() || null
}

function mapExercise(ex) {
  const t = pickEnglishTranslation(ex)
  const name = (t?.name || '').trim()
  if (!name) return null

  return {
    wger_id: ex.id,
    name,
    instructions: stripHtml(t?.description),
    muscle_group: mapPrimaryGroup(ex.muscles, ex.category?.name),
    secondary_muscles: mapAllGroups(ex.muscles_secondary || []),
    equipment: (ex.equipment || []).map((e) => e?.name).filter(Boolean),
    image_url: ex.images?.[0]?.image || null,
  }
}

async function upsertExercise(ex) {
  // Try to find existing row by wger_id first, then by case-insensitive name
  const { data: byWger } = await supabase
    .from('exercises')
    .select('id')
    .eq('wger_id', ex.wger_id)
    .maybeSingle()

  if (byWger) {
    const { error } = await supabase.from('exercises').update(ex).eq('id', byWger.id)
    return error ? { status: 'error', error } : { status: 'updated' }
  }

  const { data: byName } = await supabase
    .from('exercises')
    .select('id')
    .ilike('name', ex.name)
    .maybeSingle()

  if (byName) {
    const { error } = await supabase.from('exercises').update(ex).eq('id', byName.id)
    return error ? { status: 'error', error } : { status: 'merged' }
  }

  const { error } = await supabase.from('exercises').insert(ex)
  return error ? { status: 'error', error } : { status: 'inserted' }
}

async function main() {
  const all = await fetchAllExercises()
  console.log(`Fetched ${all.length} exercises from wger`)

  const mapped = all.map(mapExercise).filter(Boolean)
  console.log(`Mapped ${mapped.length} valid exercises`)

  let inserted = 0
  let updated = 0
  let merged = 0
  let errors = 0
  let i = 0
  for (const ex of mapped) {
    i += 1
    const result = await upsertExercise(ex)
    if (result.status === 'inserted') inserted += 1
    else if (result.status === 'updated') updated += 1
    else if (result.status === 'merged') merged += 1
    else {
      errors += 1
      console.error(`[${i}] ${ex.name}: ${result.error?.message}`)
    }
    if (i % 25 === 0) console.log(`  ${i}/${mapped.length}…`)
  }

  console.log('\nDone.')
  console.log(`  Inserted: ${inserted}`)
  console.log(`  Updated:  ${updated}`)
  console.log(`  Merged:   ${merged} (matched existing by name)`)
  console.log(`  Errors:   ${errors}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
