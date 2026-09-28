import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { initDatabase, db } from './server/db.js';
import { generateWorkoutPlanAI, refineWorkoutPlanAI, generateNutritionAdviceAI, ai } from './server/ai.js';
import { UserProfile, WorkoutPlan, NutritionPlan, WearableState } from './src/types/fitness.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Initialize SQLite database
initDatabase();

// In-memory telemetry live simulation state
let liveTelemetry = {
  liveHeartRate: 74,
  lastUpdated: Date.now(),
};

// Periodic live HR jitter to simulate wearable connection
setInterval(() => {
  const baseHR = 72;
  const jitter = Math.floor(Math.random() * 9) - 4; // -4 to +4
  liveTelemetry.liveHeartRate = Math.max(55, Math.min(185, baseHR + jitter));
  liveTelemetry.lastUpdated = Date.now();
}, 2500);

// ================= API ROUTES =================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiReady: !!process.env.GEMINI_API_KEY,
    database: 'SQLite (fitbuddy.db)',
    timestamp: new Date().toISOString(),
  });
});

// 1. User Profile CRUD
app.get('/api/user', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM users LIMIT 1').get() as any;
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user: UserProfile = {
      id: row.id,
      name: row.name,
      age: row.age,
      weight: row.weight,
      weightUnit: row.weight_unit,
      fitnessGoal: row.fitness_goal,
      workoutIntensity: row.workout_intensity,
      experienceLevel: row.experience_level,
      equipment: row.equipment,
      daysPerWeek: row.days_per_week,
      dietaryPreference: row.dietary_preference,
      injuriesOrNotes: row.injuries_notes,
      updatedAt: row.updated_at,
    };
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user', (req, res) => {
  try {
    const data = req.body as Partial<UserProfile>;
    const existing = db.prepare('SELECT id FROM users LIMIT 1').get() as any;
    const userId = existing ? existing.id : 'usr_default';
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        age = COALESCE(?, age),
        weight = COALESCE(?, weight),
        weight_unit = COALESCE(?, weight_unit),
        fitness_goal = COALESCE(?, fitness_goal),
        workout_intensity = COALESCE(?, workout_intensity),
        experience_level = COALESCE(?, experience_level),
        equipment = COALESCE(?, equipment),
        days_per_week = COALESCE(?, days_per_week),
        dietary_preference = COALESCE(?, dietary_preference),
        injuries_notes = COALESCE(?, injuries_notes),
        updated_at = ?
      WHERE id = ?
    `).run(
      data.name ?? null,
      data.age ?? null,
      data.weight ?? null,
      data.weightUnit ?? null,
      data.fitnessGoal ?? null,
      data.workoutIntensity ?? null,
      data.experienceLevel ?? null,
      data.equipment ?? null,
      data.daysPerWeek ?? null,
      data.dietaryPreference ?? null,
      data.injuriesOrNotes ?? null,
      now,
      userId
    );

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    res.json({ success: true, user: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Workout Plans (Scenario 1 & 2)
app.get('/api/plans', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM workout_plans ORDER BY updated_at DESC').all() as any[];
    const plans: WorkoutPlan[] = rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      goal: r.goal,
      intensity: r.intensity,
      overview: r.overview,
      weeklyFocus: r.weekly_focus,
      days: JSON.parse(r.days_json),
      version: r.version,
      feedbackHistory: JSON.parse(r.feedback_history_json || '[]'),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/plans/active', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM workout_plans ORDER BY updated_at DESC LIMIT 1').get() as any;
    if (!row) {
      return res.status(404).json({ error: 'No workout plan found' });
    }
    const plan: WorkoutPlan = {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      goal: row.goal,
      intensity: row.intensity,
      overview: row.overview,
      weeklyFocus: row.weekly_focus,
      days: JSON.parse(row.days_json),
      version: row.version,
      feedbackHistory: JSON.parse(row.feedback_history_json || '[]'),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    res.json(plan);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Scenario 1: Generate personalized 7-day workout plan
app.post('/api/plans/generate', async (req, res) => {
  try {
    const customUser = req.body.user as UserProfile | undefined;
    const userRow = db.prepare('SELECT * FROM users LIMIT 1').get() as any;
    const user: UserProfile = customUser || {
      id: userRow.id,
      name: userRow.name,
      age: userRow.age,
      weight: userRow.weight,
      weightUnit: userRow.weight_unit,
      fitnessGoal: userRow.fitness_goal,
      workoutIntensity: userRow.workout_intensity,
      experienceLevel: userRow.experience_level,
      equipment: userRow.equipment,
      daysPerWeek: userRow.days_per_week,
      dietaryPreference: userRow.dietary_preference,
      injuriesOrNotes: userRow.injuries_notes,
    };

    console.log(`[AI] Generating workout plan for ${user.name} (${user.fitnessGoal}, ${user.workoutIntensity})`);
    const generated = await generateWorkoutPlanAI(user);

    const planId = `plan_${Date.now()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO workout_plans (
        id, user_id, title, goal, intensity, overview, weekly_focus,
        days_json, version, feedback_history_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      planId,
      user.id,
      generated.title,
      generated.goal,
      generated.intensity,
      generated.overview,
      generated.weeklyFocus,
      JSON.stringify(generated.days),
      1,
      JSON.stringify([]),
      now,
      now
    );

    const savedPlan: WorkoutPlan = {
      id: planId,
      userId: user.id,
      title: generated.title,
      goal: generated.goal,
      intensity: generated.intensity,
      overview: generated.overview,
      weeklyFocus: generated.weeklyFocus,
      days: generated.days,
      version: 1,
      feedbackHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    res.json({ success: true, plan: savedPlan });
  } catch (error: any) {
    console.error('Plan generation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Scenario 2: Feedback-based refinement loop
app.post('/api/plans/:id/refine', async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    if (!feedback || typeof feedback !== 'string' || feedback.trim().length === 0) {
      return res.status(400).json({ error: 'Feedback text is required' });
    }

    const row = db.prepare('SELECT * FROM workout_plans WHERE id = ?').get(id) as any;
    if (!row) {
      return res.status(404).json({ error: 'Workout plan not found' });
    }

    const currentPlan: WorkoutPlan = {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      goal: row.goal,
      intensity: row.intensity,
      overview: row.overview,
      weeklyFocus: row.weekly_focus,
      days: JSON.parse(row.days_json),
      version: row.version,
      feedbackHistory: JSON.parse(row.feedback_history_json || '[]'),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(currentPlan.userId) as any;
    const user: UserProfile = userRow
      ? {
          id: userRow.id,
          name: userRow.name,
          age: userRow.age,
          weight: userRow.weight,
          weightUnit: userRow.weight_unit,
          fitnessGoal: userRow.fitness_goal,
          workoutIntensity: userRow.workout_intensity,
          experienceLevel: userRow.experience_level,
          equipment: userRow.equipment,
          daysPerWeek: userRow.days_per_week,
          dietaryPreference: userRow.dietary_preference,
        }
      : {
          id: currentPlan.userId,
          name: 'Athlete',
          age: 28,
          weight: 70,
          weightUnit: 'kg',
          fitnessGoal: currentPlan.goal as any,
          workoutIntensity: currentPlan.intensity as any,
          experienceLevel: 'intermediate',
          equipment: 'gym',
          daysPerWeek: 4,
          dietaryPreference: 'balanced',
        };

    console.log(`[AI] Refining plan ${id} (v${currentPlan.version}) with feedback: "${feedback}"`);
    const refined = await refineWorkoutPlanAI(currentPlan, feedback, user);

    const newVersion = currentPlan.version + 1;
    const now = new Date().toISOString();
    const updatedFeedbackHistory = [
      ...currentPlan.feedbackHistory,
      {
        timestamp: now,
        feedback,
        changesApplied: refined.changesApplied,
      },
    ];

    db.prepare(`
      UPDATE workout_plans SET
        overview = ?,
        weekly_focus = ?,
        days_json = ?,
        version = ?,
        feedback_history_json = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      refined.overview,
      refined.weeklyFocus,
      JSON.stringify(refined.updatedDays),
      newVersion,
      JSON.stringify(updatedFeedbackHistory),
      now,
      id
    );

    const updatedPlan: WorkoutPlan = {
      ...currentPlan,
      overview: refined.overview,
      weeklyFocus: refined.weeklyFocus,
      days: refined.updatedDays,
      version: newVersion,
      feedbackHistory: updatedFeedbackHistory,
      updatedAt: now,
    };

    res.json({
      success: true,
      changesApplied: refined.changesApplied,
      plan: updatedPlan,
    });
  } catch (error: any) {
    console.error('Plan refinement failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Nutrition & Recovery Tips (Scenario 3)
app.get('/api/nutrition/latest', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM nutrition_plans ORDER BY created_at DESC LIMIT 1').get() as any;
    if (!row) {
      return res.status(404).json({ error: 'No nutrition plan found' });
    }
    const plan: NutritionPlan = {
      id: row.id,
      userId: row.user_id,
      goal: row.goal,
      dailyCalories: row.daily_calories,
      macros: JSON.parse(row.macros_json),
      hydrationLiters: row.hydration_liters,
      preWorkoutTip: row.pre_workout_tip,
      postWorkoutTip: row.post_workout_tip,
      recoveryProtocol: row.recovery_protocol,
      sampleMealIdeas: JSON.parse(row.sample_meal_ideas_json || '[]'),
      generalTip: row.general_tip,
      createdAt: row.created_at,
    };
    res.json(plan);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/nutrition/generate', async (req, res) => {
  try {
    const userRow = db.prepare('SELECT * FROM users LIMIT 1').get() as any;
    const user: UserProfile = req.body.user || {
      id: userRow.id,
      name: userRow.name,
      age: userRow.age,
      weight: userRow.weight,
      weightUnit: userRow.weight_unit,
      fitnessGoal: userRow.fitness_goal,
      workoutIntensity: userRow.workout_intensity,
      experienceLevel: userRow.experience_level,
      equipment: userRow.equipment,
      daysPerWeek: userRow.days_per_week,
      dietaryPreference: userRow.dietary_preference,
    };

    console.log(`[AI] Generating nutrition plan for ${user.fitnessGoal} (${user.dietaryPreference})`);
    const nutritionData = await generateNutritionAdviceAI(user);

    const nutrId = `nutr_${Date.now()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO nutrition_plans (
        id, user_id, goal, daily_calories, macros_json, hydration_liters,
        pre_workout_tip, post_workout_tip, recovery_protocol,
        sample_meal_ideas_json, general_tip, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      nutrId,
      user.id,
      nutritionData.goal,
      nutritionData.dailyCalories,
      JSON.stringify(nutritionData.macros),
      nutritionData.hydrationLiters,
      nutritionData.preWorkoutTip,
      nutritionData.postWorkoutTip,
      nutritionData.recoveryProtocol,
      JSON.stringify(nutritionData.sampleMealIdeas),
      nutritionData.generalTip,
      now
    );

    const savedPlan: NutritionPlan = {
      id: nutrId,
      userId: user.id,
      goal: nutritionData.goal,
      dailyCalories: nutritionData.dailyCalories,
      macros: nutritionData.macros,
      hydrationLiters: nutritionData.hydrationLiters,
      preWorkoutTip: nutritionData.preWorkoutTip,
      postWorkoutTip: nutritionData.postWorkoutTip,
      recoveryProtocol: nutritionData.recoveryProtocol,
      sampleMealIdeas: nutritionData.sampleMealIdeas,
      generalTip: nutritionData.generalTip,
      createdAt: now,
    };

    res.json({ success: true, nutrition: savedPlan });
  } catch (error: any) {
    console.error('Nutrition generation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Quick question to nutrition coach
app.post('/api/nutrition/ask-coach', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (!ai) {
      return res.json({
        answer: 'For optimal results, consume 25-30g protein alongside complex carbs 1 hour prior to high-exertion training, and stay adequately hydrated with sodium and potassium electrolytes.',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are FitBuddy's certified sports nutrition coach. Provide a concise, scientifically grounded, actionable answer (max 3 sentences) to the user's question: "${question}"`,
    });

    res.json({ answer: response.text?.trim() || 'Focus on wholesome nutrient-dense whole foods and consistent hydration.' });
  } catch (error: any) {
    res.json({
      answer: 'Stay hydrated, consume 1.6-2.2g of protein per kg of bodyweight, and time your carbohydrate intake around your training sessions.',
    });
  }
});

// 4. Wearable Device Integration & Telemetry
app.get('/api/wearable/state', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM wearable_state LIMIT 1').get() as any;
    if (!row) {
      return res.status(404).json({ error: 'Wearable not found' });
    }

    // Determine HR Zone based on simulated current HR
    const currentHr = liveTelemetry.liveHeartRate;
    let hrZone = 'Zone 1 (Warmup)';
    if (currentHr < 65) hrZone = 'Rest';
    else if (currentHr < 115) hrZone = 'Zone 1 (Warmup)';
    else if (currentHr < 138) hrZone = 'Zone 2 (Fat Burn)';
    else if (currentHr < 158) hrZone = 'Zone 3 (Cardio)';
    else if (currentHr < 172) hrZone = 'Zone 4 (Threshold)';
    else hrZone = 'Zone 5 (Peak)';

    const state: WearableState = {
      deviceName: row.device_name,
      deviceType: row.device_type,
      isConnected: Boolean(row.is_connected),
      batteryLevel: row.battery_level,
      lastSyncedAt: row.last_synced_at,
      liveHeartRate: currentHr,
      restingHeartRate: row.resting_heart_rate,
      hrZone,
      stepsToday: row.steps_today,
      stepGoal: row.step_goal,
      activeCalories: row.active_calories,
      calorieGoal: row.calorie_goal,
      recoveryScore: row.recovery_score,
      hrvMs: row.hrv_ms,
      sleepHours: row.sleep_hours,
      sleepScore: row.sleep_score,
      vo2Max: row.vo2_max,
    };

    res.json(state);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/wearable/connect', (req, res) => {
  try {
    const { deviceName, deviceType, isConnected } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE wearable_state SET
        device_name = COALESCE(?, device_name),
        device_type = COALESCE(?, device_type),
        is_connected = COALESCE(?, is_connected),
        last_synced_at = ?
    `).run(
      deviceName ?? null,
      deviceType ?? null,
      isConnected !== undefined ? (isConnected ? 1 : 0) : null,
      now
    );

    res.json({ success: true, message: 'Wearable state updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/wearable/sync', (req, res) => {
  try {
    const now = new Date().toISOString();
    // Simulate slight step and calorie burn increments on sync
    const row = db.prepare('SELECT steps_today, active_calories FROM wearable_state LIMIT 1').get() as any;
    const newSteps = (row?.steps_today || 8000) + Math.floor(Math.random() * 85) + 15;
    const newCalories = (row?.active_calories || 500) + Math.floor(Math.random() * 12) + 3;

    db.prepare(`
      UPDATE wearable_state SET
        steps_today = ?,
        active_calories = ?,
        last_synced_at = ?
    `).run(newSteps, newCalories, now);

    res.json({ success: true, stepsToday: newSteps, activeCalories: newCalories, syncedAt: now });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Workout Logging & History
app.post('/api/workouts/log', (req, res) => {
  try {
    const {
      planId,
      dayNumber,
      dayTitle,
      durationSeconds,
      caloriesBurned,
      avgHeartRate,
      maxHeartRate,
      completedExercisesCount,
      totalExercisesCount,
      notes,
    } = req.body;

    const logId = `log_${Date.now()}`;
    const now = new Date().toISOString();
    const userRow = db.prepare('SELECT id FROM users LIMIT 1').get() as any;
    const userId = userRow?.id || 'usr_default';

    db.prepare(`
      INSERT INTO workout_logs (
        id, user_id, plan_id, day_number, day_title, duration_seconds,
        calories_burned, avg_heart_rate, max_heart_rate,
        completed_exercises_count, total_exercises_count, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      logId,
      userId,
      planId || 'plan_manual',
      dayNumber || 1,
      dayTitle || 'Daily Workout',
      durationSeconds || 1800,
      caloriesBurned || 300,
      avgHeartRate || 135,
      maxHeartRate || 165,
      completedExercisesCount || 4,
      totalExercisesCount || 4,
      notes || '',
      now
    );

    // Also update wearable active calories and steps
    db.prepare(`
      UPDATE wearable_state SET
        active_calories = active_calories + ?,
        steps_today = steps_today + 1200,
        last_synced_at = ?
    `).run(caloriesBurned || 300, now);

    res.json({ success: true, logId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/workouts/history', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM workout_logs ORDER BY created_at DESC LIMIT 20').all() as any[];
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Overall Stats
app.get('/api/stats', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM workout_logs').all() as any[];
    const wearable = db.prepare('SELECT * FROM wearable_state LIMIT 1').get() as any;

    const totalWorkouts = logs.length;
    const totalMinutes = Math.round(logs.reduce((acc, l) => acc + (l.duration_seconds || 0), 0) / 60);
    const totalCaloriesBurned = logs.reduce((acc, l) => acc + (l.calories_burned || 0), 0);

    res.json({
      totalWorkouts,
      totalMinutes,
      totalCaloriesBurned,
      streakDays: totalWorkouts > 0 ? Math.min(7, totalWorkouts + 1) : 1,
      stepsToday: wearable?.steps_today || 8420,
      activeCaloriesToday: wearable?.active_calories || 480,
      recoveryScore: wearable?.recovery_score || 88,
      sleepHours: wearable?.sleep_hours || 7.5,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ================= VITE DEV / PRODUCTION MIDDLEWARE =================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = process.env.PORT || 3000;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`FitBuddy Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start FitBuddy server:', err);
  process.exit(1);
});
