import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { UserProfile, WorkoutPlan, NutritionPlan, WorkoutLog, WearableState } from '../src/types/fitness.js';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
const DB_PATH = path.join(DB_DIR, 'fitbuddy.db');

export const db = new DatabaseSync(DB_PATH);

// Initialize SQLite tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      weight REAL NOT NULL,
      weight_unit TEXT NOT NULL DEFAULT 'kg',
      fitness_goal TEXT NOT NULL,
      workout_intensity TEXT NOT NULL,
      experience_level TEXT NOT NULL,
      equipment TEXT NOT NULL,
      days_per_week INTEGER NOT NULL,
      dietary_preference TEXT NOT NULL DEFAULT 'balanced',
      injuries_notes TEXT DEFAULT '',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      goal TEXT NOT NULL,
      intensity TEXT NOT NULL,
      overview TEXT NOT NULL,
      weekly_focus TEXT NOT NULL,
      days_json TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      feedback_history_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS nutrition_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      goal TEXT NOT NULL,
      daily_calories INTEGER NOT NULL,
      macros_json TEXT NOT NULL,
      hydration_liters REAL NOT NULL,
      pre_workout_tip TEXT NOT NULL,
      post_workout_tip TEXT NOT NULL,
      recovery_protocol TEXT NOT NULL,
      sample_meal_ideas_json TEXT NOT NULL,
      general_tip TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      day_number INTEGER NOT NULL,
      day_title TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      calories_burned INTEGER NOT NULL,
      avg_heart_rate INTEGER NOT NULL,
      max_heart_rate INTEGER NOT NULL,
      completed_exercises_count INTEGER NOT NULL,
      total_exercises_count INTEGER NOT NULL,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wearable_state (
      user_id TEXT PRIMARY KEY,
      device_name TEXT NOT NULL,
      device_type TEXT NOT NULL,
      is_connected INTEGER NOT NULL DEFAULT 1,
      battery_level INTEGER NOT NULL DEFAULT 88,
      last_synced_at TEXT NOT NULL,
      live_heart_rate INTEGER NOT NULL DEFAULT 74,
      resting_heart_rate INTEGER NOT NULL DEFAULT 58,
      hr_zone TEXT NOT NULL DEFAULT 'Zone 1 (Warmup)',
      steps_today INTEGER NOT NULL DEFAULT 8420,
      step_goal INTEGER NOT NULL DEFAULT 10000,
      active_calories INTEGER NOT NULL DEFAULT 480,
      calorie_goal INTEGER NOT NULL DEFAULT 650,
      recovery_score INTEGER NOT NULL DEFAULT 85,
      hrv_ms INTEGER NOT NULL DEFAULT 64,
      sleep_hours REAL NOT NULL DEFAULT 7.5,
      sleep_score INTEGER NOT NULL DEFAULT 88,
      vo2_max REAL NOT NULL DEFAULT 46.5
    );
  `);

  // Seed default user if none exists
  const existingUser = db.prepare('SELECT id FROM users LIMIT 1').get();
  if (!existingUser) {
    seedDefaultData();
  }
}

function seedDefaultData() {
  const userId = 'usr_default';
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (
      id, name, age, weight, weight_unit, fitness_goal, workout_intensity,
      experience_level, equipment, days_per_week, dietary_preference,
      injuries_notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    'Alex Morgan',
    28,
    72.5,
    'kg',
    'muscle_gain',
    'medium',
    'intermediate',
    'gym',
    4,
    'high_protein',
    'Slight lower back tightness; prefer supported barbell or dumbbell variations.',
    now
  );

  // Seed wearable device
  db.prepare(`
    INSERT INTO wearable_state (
      user_id, device_name, device_type, is_connected, battery_level,
      last_synced_at, live_heart_rate, resting_heart_rate, hr_zone,
      steps_today, step_goal, active_calories, calorie_goal, recovery_score,
      hrv_ms, sleep_hours, sleep_score, vo2_max
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    'Apple Watch Ultra 2',
    'apple_watch',
    1,
    86,
    now,
    72,
    58,
    'Zone 1 (Warmup)',
    8740,
    10000,
    512,
    650,
    88,
    66,
    7.8,
    91,
    47.2
  );

  // Seed initial workout plan
  const samplePlan: WorkoutPlan = {
    id: 'plan_seed_01',
    userId,
    title: '4-Day Hypertrophy & Athletic Conditioning Split',
    goal: 'muscle_gain',
    intensity: 'medium',
    overview: 'A balanced upper/lower progressive overload split designed for hypertrophy, joint integrity, and cardiovascular resilience.',
    weeklyFocus: 'Time-under-tension focus with moderate rest intervals (60-90s) and steady zone-2 aerobic conditioning.',
    days: [
      {
        dayNumber: 1,
        dayName: 'Day 1',
        title: 'Upper Body Power & Push Focus',
        isRestDay: false,
        estimatedMinutes: 50,
        estimatedCalories: 380,
        targetHeartRateZone: 'Zone 3 - Aerobic (130-145 BPM)',
        warmup: {
          durationMinutes: 6,
          instructions: ['Band shoulder dislocations (15 reps)', 'Scapular pull-ups (10 reps)', 'Arm circles & wrist mobility']
        },
        exercises: [
          {
            id: 'ex_1',
            name: 'Incline Dumbbell Chest Press',
            sets: 4,
            reps: '8-10',
            restSeconds: 90,
            targetMuscle: 'Upper Chest & Front Delts',
            formTips: 'Squeeze chest at top without locking elbows; lower under control for 3 seconds.'
          },
          {
            id: 'ex_2',
            name: 'Chest-Supported Dumbbell Row',
            sets: 4,
            reps: '10-12',
            restSeconds: 75,
            targetMuscle: 'Rhomboids, Lats & Rear Delts',
            formTips: 'Pull elbows toward your hips, pausing for 1 second at full contraction.'
          },
          {
            id: 'ex_3',
            name: 'Overhead Dumbbell Shoulder Press',
            sets: 3,
            reps: '10-12',
            restSeconds: 60,
            targetMuscle: 'Anterior & Lateral Deltoids',
            formTips: 'Keep core engaged and ribs tucked down to protect lower back.'
          },
          {
            id: 'ex_4',
            name: 'Cable Triceps Rope Pushdown',
            sets: 3,
            reps: '12-15',
            restSeconds: 45,
            targetMuscle: 'Triceps Brachii',
            formTips: 'Flare rope outward at the bottom for peak triceps contraction.'
          }
        ],
        cooldown: {
          durationMinutes: 5,
          instructions: ['Doorway chest stretch (60s each side)', 'Overhead tricep stretch', 'Child pose with deep diaphragmatic breaths']
        },
        recoveryTip: 'Hydrate with electrolytes and consume 30-35g fast-digesting protein within 60 minutes.'
      },
      {
        dayNumber: 2,
        dayName: 'Day 2',
        title: 'Lower Body Strength & Core Stability',
        isRestDay: false,
        estimatedMinutes: 55,
        estimatedCalories: 430,
        targetHeartRateZone: 'Zone 3-4 (140-160 BPM)',
        warmup: {
          durationMinutes: 8,
          instructions: ['Bodyweight hip hinges (15 reps)', 'World greatest stretch (5 reps each side)', 'Glute bridges (12 reps)']
        },
        exercises: [
          {
            id: 'ex_5',
            name: 'Goblet Squat (Heels Elevated)',
            sets: 4,
            reps: '10-12',
            restSeconds: 90,
            targetMuscle: 'Quadriceps & Glutes',
            formTips: 'Keep torso upright, knees tracking over toes, and maintain controlled tempo.'
          },
          {
            id: 'ex_6',
            name: 'Romanian Deadlift (Dumbbells)',
            sets: 3,
            reps: '10-12',
            restSeconds: 75,
            targetMuscle: 'Hamstrings & Posterior Chain',
            formTips: 'Hinge deeply at hips with flat back; feel the stretch in hamstrings before driving hips forward.'
          },
          {
            id: 'ex_7',
            name: 'Bulgarian Split Squat',
            sets: 3,
            reps: '8-10 per leg',
            restSeconds: 60,
            targetMuscle: 'Glute Medius & Quads',
            formTips: 'Slight forward lean at torso to target glute fibers and relieve knee strain.'
          },
          {
            id: 'ex_8',
            name: 'Hanging Knee Raises or Plank Hold',
            sets: 3,
            reps: '12-15 reps / 45s hold',
            restSeconds: 45,
            targetMuscle: 'Rectus Abdominis & Deep Core',
            formTips: 'Curl pelvis toward ribs on knee raises; do not swing with momentum.'
          }
        ],
        cooldown: {
          durationMinutes: 6,
          instructions: ['Kneeling hip flexor stretch (90s each side)', 'Hamstring towel stretch', 'Foam roll glutes & IT bands']
        },
        recoveryTip: 'Prioritize 8+ hours of sleep tonight; lower body recovery drives total testosterone and growth hormone.'
      },
      {
        dayNumber: 3,
        dayName: 'Day 3',
        title: 'Active Recovery & Mobility Flow',
        isRestDay: true,
        estimatedMinutes: 30,
        estimatedCalories: 160,
        targetHeartRateZone: 'Zone 1 - Recovery (100-115 BPM)',
        warmup: {
          durationMinutes: 5,
          instructions: ['Cat-Cow flow (10 cycles)', 'Thoracic spine rotations']
        },
        exercises: [
          {
            id: 'ex_rec_1',
            name: 'Outdoor Brisk Walking or Light Cycling',
            sets: 1,
            reps: '25-30 min',
            restSeconds: 0,
            targetMuscle: 'Cardiovascular & Lymphatic Flow',
            formTips: 'Maintain conversational pace in wearable Zone 1 to promote blood flow without muscle fatigue.'
          },
          {
            id: 'ex_rec_2',
            name: 'Full Body Mobility & Hip Decompression',
            sets: 1,
            reps: '10 min',
            restSeconds: 0,
            targetMuscle: 'Joint Capsule Mobility',
            formTips: 'Pigeon pose, 90/90 hip flow, and ankle dorsiflexion rocks.'
          }
        ],
        cooldown: {
          durationMinutes: 5,
          instructions: ['Box breathing (4s inhale, 4s hold, 4s exhale, 4s hold) for 5 minutes']
        },
        recoveryTip: 'Active recovery increases nutrient delivery to damaged muscle fibers by up to 40% compared to sedentary rest.'
      },
      {
        dayNumber: 4,
        dayName: 'Day 4',
        title: 'Upper Body Pull & Shoulder Sculpt',
        isRestDay: false,
        estimatedMinutes: 48,
        estimatedCalories: 360,
        targetHeartRateZone: 'Zone 3 (130-145 BPM)',
        warmup: {
          durationMinutes: 6,
          instructions: ['Band pull-aparts (20 reps)', 'Dead hangs (30s hold)', 'Neck rolls & lateral bends']
        },
        exercises: [
          {
            id: 'ex_9',
            name: 'Lat Pulldown or Assisted Pull-ups',
            sets: 4,
            reps: '8-10',
            restSeconds: 75,
            targetMuscle: 'Latissimus Dorsi & Teres Major',
            formTips: 'Lead with chest high and drive elbows down toward rear pocket.'
          },
          {
            id: 'ex_10',
            name: 'Seated Cable Row (Neutral Grip)',
            sets: 3,
            reps: '10-12',
            restSeconds: 60,
            targetMuscle: 'Mid-back, Rhomboids, Traps',
            formTips: 'Do not rock torso back and forth; isolate scapular retraction.'
          },
          {
            id: 'ex_11',
            name: 'Dumbbell Lateral Raises (Strict)',
            sets: 4,
            reps: '12-15',
            restSeconds: 45,
            targetMuscle: 'Lateral Deltoids (Cap Shoulders)',
            formTips: 'Pinkies slightly elevated; imagine pouring water from two pitchers at the top.'
          },
          {
            id: 'ex_12',
            name: 'Incline Dumbbell Biceps Curl',
            sets: 3,
            reps: '10-12',
            restSeconds: 45,
            targetMuscle: 'Biceps Brachii (Long Head)',
            formTips: 'Full stretch at the bottom; do not let elbows drift forward.'
          }
        ],
        cooldown: {
          durationMinutes: 5,
          instructions: ['Biceps wall stretch', 'Cross-body shoulder stretch', 'Deep breathing']
        },
        recoveryTip: 'Pair today’s dinner with complex carbohydrates (quinoa or sweet potatoes) to replenish muscle glycogen.'
      },
      {
        dayNumber: 5,
        dayName: 'Day 5',
        title: 'Athletic Conditioning & Core Burn',
        isRestDay: false,
        estimatedMinutes: 45,
        estimatedCalories: 410,
        targetHeartRateZone: 'Zone 4 - Threshold (145-165 BPM)',
        warmup: {
          durationMinutes: 6,
          instructions: ['Jumping jacks (30s)', 'High knees (30s)', 'Inchworms with push-up (6 reps)']
        },
        exercises: [
          {
            id: 'ex_13',
            name: 'Kettlebell or Dumbbell Swings',
            sets: 4,
            reps: '15-20',
            restSeconds: 60,
            targetMuscle: 'Glutes, Hamstrings & Cardiovascular System',
            formTips: 'Powerful hip snap; arms act merely as ropes holding the weight.'
          },
          {
            id: 'ex_14',
            name: 'Dumbbell Renegade Rows into Push-up',
            sets: 3,
            reps: '8 per side',
            restSeconds: 60,
            targetMuscle: 'Core Anti-Rotation & Chest',
            formTips: 'Keep feet wide for base stability; prevent hips from swiveling.'
          },
          {
            id: 'ex_15',
            name: 'Rowing Machine or Stationary Bike Intervals',
            sets: 6,
            reps: '45s work / 45s easy',
            restSeconds: 45,
            targetMuscle: 'Cardio Stamina & Lactic Threshold',
            formTips: 'Spike wearable HR into Zone 4 during the work interval.'
          }
        ],
        cooldown: {
          durationMinutes: 6,
          instructions: ['Downward Dog calf pedal', 'Cobra pose for abdominal release', 'Slow seated forward bend']
        },
        recoveryTip: 'Ensure 3L water today plus magnesium glycinate before bed to support muscle relaxation.'
      },
      {
        dayNumber: 6,
        dayName: 'Day 6',
        title: 'Rest & Myofascial Release',
        isRestDay: true,
        estimatedMinutes: 20,
        estimatedCalories: 110,
        targetHeartRateZone: 'Zone 1 (Rest & Digest)',
        warmup: {
          durationMinutes: 3,
          instructions: ['Gentle neck and shoulder rolls']
        },
        exercises: [
          {
            id: 'ex_rec_3',
            name: 'Full Body Foam Rolling & Trigger Point Release',
            sets: 1,
            reps: '15 min',
            restSeconds: 0,
            targetMuscle: 'Myofascial Tissue & Blood Flow',
            formTips: 'Spend 60 seconds on tight spots around quads, lats, and glutes.'
          }
        ],
        cooldown: {
          durationMinutes: 5,
          instructions: ['Legs up the wall pose (5 min) to facilitate venous return']
        },
        recoveryTip: 'Check your wearable recovery score today to gauge readiness for next week’s training cycle.'
      },
      {
        dayNumber: 7,
        dayName: 'Day 7',
        title: 'Weekly Reset & Low-Intensity Cardio',
        isRestDay: true,
        estimatedMinutes: 35,
        estimatedCalories: 190,
        targetHeartRateZone: 'Zone 2 (115-130 BPM)',
        warmup: {
          durationMinutes: 5,
          instructions: ['Dynamic leg swings and torso twists']
        },
        exercises: [
          {
            id: 'ex_rec_4',
            name: 'Nature Walk, Casual Swim, or Incline Treadmill Walk',
            sets: 1,
            reps: '30-40 min',
            restSeconds: 0,
            targetMuscle: 'Aerobic Base & Mental Wellbeing',
            formTips: 'Keep heart rate in strict Zone 2. You should easily be able to talk in full sentences.'
          }
        ],
        cooldown: {
          durationMinutes: 5,
          instructions: ['Gentle seated hamstring and quad stretches']
        },
        recoveryTip: 'Review your weekly volume and wearable stats. Prepare your meal prep for the coming week.'
      }
    ],
    version: 1,
    feedbackHistory: [],
    createdAt: now,
    updatedAt: now
  };

  db.prepare(`
    INSERT INTO workout_plans (
      id, user_id, title, goal, intensity, overview, weekly_focus,
      days_json, version, feedback_history_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    samplePlan.id,
    samplePlan.userId,
    samplePlan.title,
    samplePlan.goal,
    samplePlan.intensity,
    samplePlan.overview,
    samplePlan.weeklyFocus,
    JSON.stringify(samplePlan.days),
    samplePlan.version,
    JSON.stringify(samplePlan.feedbackHistory),
    samplePlan.createdAt,
    samplePlan.updatedAt
  );

  // Seed sample nutrition plan
  const sampleNutrition: NutritionPlan = {
    id: 'nutr_seed_01',
    userId,
    goal: 'muscle_gain',
    dailyCalories: 2650,
    macros: {
      proteinGrams: 165,
      carbsGrams: 300,
      fatGrams: 75,
      proteinPercent: 25,
      carbsPercent: 45,
      fatPercent: 30
    },
    hydrationLiters: 3.2,
    preWorkoutTip: 'Consume 30-40g easily digestible carbs (banana with 1 tbsp almond butter or oatmeal) 45-60 min prior.',
    postWorkoutTip: 'Consume 30-35g whey or plant protein with 40-50g fast carbs within 45 min to optimize muscle protein synthesis (MPS).',
    recoveryProtocol: 'Aim for 7.5 to 8.5 hours of uninterrupted sleep in a cool (66°F / 19°C) dark environment. Take 300mg magnesium bisglycinate.',
    sampleMealIdeas: [
      {
        meal: 'Breakfast: Power Fuel Bowl',
        description: 'Rolled oats cooked in almond milk with 1 scoop vanilla whey/plant protein, chia seeds, sliced banana, and a drizzle of honey.',
        calories: 580,
        protein: 36
      },
      {
        meal: 'Lunch: Grilled Chicken & Quinoa Harvest Bowl',
        description: '180g grilled chicken breast, 1 cup cooked quinoa, roasted sweet potatoes, steamed broccoli, and avocado lemon dressing.',
        calories: 680,
        protein: 48
      },
      {
        meal: 'Dinner: Wild Salmon & Jasmine Rice',
        description: '200g wild-caught salmon fillet, 1.5 cups jasmine rice, sautéed asparagus in olive oil, and kimchi for gut microbiome support.',
        calories: 720,
        protein: 44
      },
      {
        meal: 'Snack: Greek Yogurt & Berry Crunch',
        description: '1 cup 2% plain Greek yogurt with mixed fresh blueberries, crushed walnuts, and cinnamon.',
        calories: 320,
        protein: 24
      }
    ],
    generalTip: 'For muscle gain, maintain a consistent 250-350 calorie surplus and distribute protein intake evenly across 4 meals (approx 35-40g per meal).',
    createdAt: now
  };

  db.prepare(`
    INSERT INTO nutrition_plans (
      id, user_id, goal, daily_calories, macros_json, hydration_liters,
      pre_workout_tip, post_workout_tip, recovery_protocol,
      sample_meal_ideas_json, general_tip, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sampleNutrition.id,
    sampleNutrition.userId,
    sampleNutrition.goal,
    sampleNutrition.dailyCalories,
    JSON.stringify(sampleNutrition.macros),
    sampleNutrition.hydrationLiters,
    sampleNutrition.preWorkoutTip,
    sampleNutrition.postWorkoutTip,
    sampleNutrition.recoveryProtocol,
    JSON.stringify(sampleNutrition.sampleMealIdeas),
    sampleNutrition.generalTip,
    sampleNutrition.createdAt
  );

  // Seed sample workout log
  db.prepare(`
    INSERT INTO workout_logs (
      id, user_id, plan_id, day_number, day_title, duration_seconds,
      calories_burned, avg_heart_rate, max_heart_rate,
      completed_exercises_count, total_exercises_count, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'log_seed_01',
    userId,
    samplePlan.id,
    1,
    'Upper Body Power & Push Focus',
    3060, // 51 mins
    394,
    136,
    162,
    4,
    4,
    'Felt strong on incline press. Used 26kg dumbbells. Wearable synced perfectly!',
    new Date(Date.now() - 86400000).toISOString()
  );
}
