import { GoogleGenAI } from '@google/genai';
import { UserProfile, WorkoutPlan, NutritionPlan, WorkoutDay } from '../src/types/fitness.js';

const apiKey = process.env.GEMINI_API_KEY || '';

export const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Helper to sanitize JSON response from Gemini
function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
}

export async function generateWorkoutPlanAI(user: UserProfile): Promise<Omit<WorkoutPlan, 'id' | 'userId' | 'version' | 'feedbackHistory' | 'createdAt' | 'updatedAt'>> {
  if (!ai) {
    console.log('No GEMINI_API_KEY found, using intelligent rule-based generator');
    return generateFallbackPlan(user);
  }

  const prompt = `You are FitBuddy's Chief Sports Scientist & Elite Strength Coach.
Design an evidence-based, highly customized 7-day fitness and workout schedule for the following user:
- Name: ${user.name}
- Age: ${user.age}
- Weight: ${user.weight} ${user.weightUnit}
- Fitness Goal: ${user.fitnessGoal} (options: weight_loss, muscle_gain, wellness, endurance, strength)
- Workout Intensity: ${user.workoutIntensity} (low, medium, high)
- Experience Level: ${user.experienceLevel} (beginner, intermediate, advanced)
- Equipment: ${user.equipment} (gym, dumbbells, bodyweight)
- Training Days per Week: ${user.daysPerWeek} (the remaining days must be designated as active recovery or rest days)
- Notes/Injuries/Focus: ${user.injuriesOrNotes || 'None specified'}

REQUIREMENTS:
1. Provide a 7-day schedule (Day 1 through Day 7). Exactly ${user.daysPerWeek} days should be training days, and the remaining 7 - ${user.daysPerWeek} days must have isRestDay: true with light mobility/recovery.
2. For each day, provide:
   - dayNumber: 1 to 7
   - dayName: "Day 1", "Day 2", etc.
   - title: e.g. "Upper Body Push & Hypertrophy", "Active Recovery & Mobility", etc.
   - isRestDay: boolean
   - estimatedMinutes: number (e.g. 35 to 60)
   - estimatedCalories: number (e.g. 250 to 500)
   - targetHeartRateZone: string (e.g. "Zone 2 (120-135 BPM)" or "Zone 4 (150-165 BPM)")
   - warmup: { durationMinutes: number, instructions: string[] }
   - exercises: Array of 3 to 6 exercises with:
     - id: unique string (e.g. "ex_1")
     - name: exercise name
     - sets: number (e.g. 3 or 4)
     - reps: string (e.g. "8-10", "12-15", "45s hold")
     - restSeconds: number (e.g. 60, 90)
     - targetMuscle: string
     - formTips: concise coaching cue
   - cooldown: { durationMinutes: number, instructions: string[] }
   - recoveryTip: targeted recovery tip aligning with user's wearable targets

Output strictly valid JSON matching this schema:
{
  "title": string,
  "goal": "${user.fitnessGoal}",
  "intensity": "${user.workoutIntensity}",
  "overview": string,
  "weeklyFocus": string,
  "days": [ ...7 workout day objects... ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are FitBuddy AI, a premier fitness and exercise physiology AI. Return only valid JSON without markdown wrapping.',
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);

    if (parsed && Array.isArray(parsed.days) && parsed.days.length === 7) {
      return {
        title: parsed.title || `${user.name}'s Personalized 7-Day ${user.fitnessGoal} Routine`,
        goal: user.fitnessGoal,
        intensity: user.workoutIntensity,
        overview: parsed.overview || 'Customized routine tailored to your fitness objectives.',
        weeklyFocus: parsed.weeklyFocus || 'Progressive overload and aerobic conditioning.',
        days: parsed.days,
      };
    }
    throw new Error('AI output did not contain 7 days');
  } catch (error) {
    console.error('Gemini generateWorkoutPlan error:', error);
    return generateFallbackPlan(user);
  }
}

export async function refineWorkoutPlanAI(
  currentPlan: WorkoutPlan,
  feedback: string,
  user: UserProfile
): Promise<{ updatedDays: WorkoutDay[]; overview: string; weeklyFocus: string; changesApplied: string }> {
  if (!ai) {
    console.log('No GEMINI_API_KEY found, using rule-based refinement');
    return refineFallbackPlan(currentPlan, feedback);
  }

  const prompt = `You are FitBuddy's AI Fitness Coach.
A user has submitted feedback on their current 7-day workout plan. You must update and refine the workout plan according to their exact feedback.

User Profile:
- Name: ${user.name}
- Fitness Goal: ${currentPlan.goal}
- Intensity: ${currentPlan.intensity}
- Equipment: ${user.equipment}

User's Feedback / Requested Adjustments:
"${feedback}"

Current 7-Day Plan Days:
${JSON.stringify(currentPlan.days, null, 2)}

INSTRUCTIONS:
1. Revise the 7 days of workouts to address the user's feedback precisely (e.g., more cardio, extra rest day, substituting knee-intensive squats, shorter time limits, specific muscle focus).
2. Ensure realistic exercise progressions, sets, reps, warmups, and cooldowns.
3. Summarize in 1-2 concise sentences what was adjusted in "changesApplied".

Return strictly valid JSON with this format:
{
  "overview": string,
  "weeklyFocus": string,
  "changesApplied": string,
  "updatedDays": [ ...7 workout day objects matching the exact structure... ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are FitBuddy AI. You refine fitness routines based on user feedback. Output strictly valid JSON.',
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);

    if (parsed && Array.isArray(parsed.updatedDays) && parsed.updatedDays.length === 7) {
      return {
        updatedDays: parsed.updatedDays,
        overview: parsed.overview || currentPlan.overview,
        weeklyFocus: parsed.weeklyFocus || currentPlan.weeklyFocus,
        changesApplied: parsed.changesApplied || `Applied modifications based on: "${feedback}"`,
      };
    }
    throw new Error('AI output did not contain 7 updated days');
  } catch (error) {
    console.error('Gemini refineWorkoutPlan error:', error);
    return refineFallbackPlan(currentPlan, feedback);
  }
}

export async function generateNutritionAdviceAI(
  user: UserProfile
): Promise<Omit<NutritionPlan, 'id' | 'userId' | 'createdAt'>> {
  if (!ai) {
    console.log('No GEMINI_API_KEY found, using evidence-based nutrition calculator');
    return generateFallbackNutrition(user);
  }

  const prompt = `You are FitBuddy's Certified Sports Nutritionist.
Generate a targeted nutrition and recovery recommendation for this individual:
- Age: ${user.age}
- Weight: ${user.weight} ${user.weightUnit}
- Fitness Goal: ${user.fitnessGoal} (weight_loss, muscle_gain, wellness, endurance, strength)
- Workout Intensity: ${user.workoutIntensity} (low, medium, high)
- Dietary Preference: ${user.dietaryPreference} (balanced, high_protein, plant_based, low_carb, keto)
- Target Training Days: ${user.daysPerWeek} days/week

REQUIREMENTS:
1. Calculate realistic daily caloric intake and macro breakdown (Protein grams, Carbs grams, Fat grams, and percentages).
2. Hydration recommendation in liters (e.g. 2.8 to 3.8L).
3. Pre-workout fueling strategy (timing and food suggestions).
4. Post-workout recovery nutrition (protein synthesis & glycogen replenishment).
5. Comprehensive recovery & sleep protocol (incorporating wearable metrics like HRV and Sleep Score).
6. 4 sample meal ideas tailored to dietary preference (${user.dietaryPreference}).
7. General actionable nutrition rule for their goal (${user.fitnessGoal}).

Return strictly valid JSON matching this schema:
{
  "dailyCalories": number,
  "macros": {
    "proteinGrams": number,
    "carbsGrams": number,
    "fatGrams": number,
    "proteinPercent": number,
    "carbsPercent": number,
    "fatPercent": number
  },
  "hydrationLiters": number,
  "preWorkoutTip": string,
  "postWorkoutTip": string,
  "recoveryProtocol": string,
  "sampleMealIdeas": [
    {
      "meal": string,
      "description": string,
      "calories": number,
      "protein": number
    }
  ],
  "generalTip": string
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are FitBuddy AI sports nutritionist. Return only valid JSON.',
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);

    return {
      goal: user.fitnessGoal,
      dailyCalories: parsed.dailyCalories || 2400,
      macros: parsed.macros || {
        proteinGrams: 160,
        carbsGrams: 260,
        fatGrams: 70,
        proteinPercent: 25,
        carbsPercent: 45,
        fatPercent: 30,
      },
      hydrationLiters: parsed.hydrationLiters || 3.0,
      preWorkoutTip: parsed.preWorkoutTip || 'Carbs and light protein 45m before workout.',
      postWorkoutTip: parsed.postWorkoutTip || '30g protein and carbs within 1 hour post workout.',
      recoveryProtocol: parsed.recoveryProtocol || 'Prioritize 8 hours sleep and track resting heart rate.',
      sampleMealIdeas: parsed.sampleMealIdeas || [],
      generalTip: parsed.generalTip || 'Consistency in daily macro intake produces best long-term adaptations.',
    };
  } catch (error) {
    console.error('Gemini generateNutritionAdvice error:', error);
    return generateFallbackNutrition(user);
  }
}

// Fallback Generators to ensure 100% reliability
function generateFallbackPlan(user: UserProfile) {
  const isLoss = user.fitnessGoal === 'weight_loss';
  const isEndurance = user.fitnessGoal === 'endurance';
  const isHome = user.equipment === 'bodyweight' || user.equipment === 'dumbbells';

  const days: WorkoutDay[] = [
    {
      dayNumber: 1,
      dayName: 'Day 1',
      title: isLoss ? 'HIIT & Full-Body Metabolic Conditioning' : 'Upper Body Hypertrophy & Core',
      isRestDay: false,
      estimatedMinutes: user.workoutIntensity === 'high' ? 55 : 45,
      estimatedCalories: isLoss ? 420 : 360,
      targetHeartRateZone: isLoss ? 'Zone 4 - Threshold (145-165 BPM)' : 'Zone 3 - Aerobic (130-145 BPM)',
      warmup: {
        durationMinutes: 6,
        instructions: ['Jumping jacks (60s)', 'Arm circles & chest openers', 'Dynamic high knees']
      },
      exercises: [
        {
          id: 'ex_1',
          name: isHome ? 'Dumbbell or Push-Up Floor Press' : 'Barbell Bench Press',
          sets: 4,
          reps: isLoss ? '12-15' : '8-10',
          restSeconds: isLoss ? 45 : 75,
          targetMuscle: 'Pectorals & Triceps',
          formTips: 'Maintain tight core, drive feet into the floor, controlled descent.'
        },
        {
          id: 'ex_2',
          name: isHome ? 'Bent-Over Dumbbell Rows' : 'Lat Pulldowns',
          sets: 4,
          reps: '10-12',
          restSeconds: 60,
          targetMuscle: 'Lats & Upper Back',
          formTips: 'Squeeze shoulder blades together at peak contraction.'
        },
        {
          id: 'ex_3',
          name: 'Dumbbell Shoulder Press',
          sets: 3,
          reps: '10-12',
          restSeconds: 60,
          targetMuscle: 'Deltoids',
          formTips: 'Keep core engaged to avoid arching lower spine.'
        },
        {
          id: 'ex_4',
          name: isLoss ? 'Mountain Climbers into Burpees' : 'Plank Hold with Arm Reach',
          sets: 3,
          reps: isLoss ? '45s max effort' : '60s hold',
          restSeconds: 45,
          targetMuscle: 'Core & Cardiovascular',
          formTips: 'Stay steady and keep breathing rhythm synced with wearable.'
        }
      ],
      cooldown: {
        durationMinutes: 5,
        instructions: ['Doorway chest stretch', 'Shoulder stretch', 'Slow diaphragmatic breathing']
      },
      recoveryTip: 'Rehydrate with 500ml water and electrolytes immediately post session.'
    },
    {
      dayNumber: 2,
      dayName: 'Day 2',
      title: 'Lower Body Strength & Posterior Chain',
      isRestDay: false,
      estimatedMinutes: 50,
      estimatedCalories: 410,
      targetHeartRateZone: 'Zone 3-4 (135-155 BPM)',
      warmup: {
        durationMinutes: 7,
        instructions: ['Hip hinges', 'Glute bridges (15 reps)', 'Ankle mobility rocks']
      },
      exercises: [
        {
          id: 'ex_5',
          name: isHome ? 'Goblet Squats or Bodyweight Jump Squats' : 'Barbell Back Squat',
          sets: 4,
          reps: '10-12',
          restSeconds: 75,
          targetMuscle: 'Quadriceps & Glutes',
          formTips: 'Keep chest tall, push knees out over toes.'
        },
        {
          id: 'ex_6',
          name: 'Dumbbell Romanian Deadlift',
          sets: 3,
          reps: '10-12',
          restSeconds: 60,
          targetMuscle: 'Hamstrings & Glutes',
          formTips: 'Hinge hips backwards; keep weights close to shins.'
        },
        {
          id: 'ex_7',
          name: 'Walking Lunges',
          sets: 3,
          reps: '10 per leg',
          restSeconds: 60,
          targetMuscle: 'Glutes & Balance',
          formTips: 'Maintain 90-degree bend in front and back knees.'
        }
      ],
      cooldown: {
        durationMinutes: 5,
        instructions: ['Standing quad stretch', 'Hamstring floor stretch', 'Child pose']
      },
      recoveryTip: 'Active recovery sleep: sleep in 67°F room to lower nocturnal heart rate.'
    },
    {
      dayNumber: 3,
      dayName: 'Day 3',
      title: 'Active Recovery & Zone-2 Mobility',
      isRestDay: true,
      estimatedMinutes: 30,
      estimatedCalories: 150,
      targetHeartRateZone: 'Zone 1-2 (105-120 BPM)',
      warmup: {
        durationMinutes: 5,
        instructions: ['Gentle neck and shoulder rolls', 'Cat-cow flow']
      },
      exercises: [
        {
          id: 'ex_rec_1',
          name: 'Brisk Walk or Easy Stationary Spin',
          sets: 1,
          reps: '25 min',
          restSeconds: 0,
          targetMuscle: 'Aerobic Base & Lymphatic Flow',
          formTips: 'Keep HR strictly in Zone 1-2 to flush metabolic byproducts.'
        }
      ],
      cooldown: {
        durationMinutes: 5,
        instructions: ['Full body foam rolling & thoracic twists']
      },
      recoveryTip: 'Prioritize mental decompression and gentle hydration.'
    },
    {
      dayNumber: 4,
      dayName: 'Day 4',
      title: 'Core Power, Back & Pull Specialization',
      isRestDay: false,
      estimatedMinutes: 45,
      estimatedCalories: 350,
      targetHeartRateZone: 'Zone 3 (130-145 BPM)',
      warmup: {
        durationMinutes: 5,
        instructions: ['Band pull-aparts', 'Dead hangs from bar (30s)']
      },
      exercises: [
        {
          id: 'ex_8',
          name: isHome ? 'Dumbbell Single-Arm Row' : 'Barbell Row',
          sets: 4,
          reps: '8-10',
          restSeconds: 75,
          targetMuscle: 'Lats & Rhomboids',
          formTips: 'Pull with elbows, not wrists.'
        },
        {
          id: 'ex_9',
          name: 'Dumbbell Hammer Curls',
          sets: 3,
          reps: '12',
          restSeconds: 45,
          targetMuscle: 'Biceps & Forearms',
          formTips: 'Keep elbows pinned to side; avoid swinging.'
        },
        {
          id: 'ex_10',
          name: 'Hanging Leg Raises / Lying Leg Tucks',
          sets: 3,
          reps: '15',
          restSeconds: 45,
          targetMuscle: 'Lower Abs',
          formTips: 'Control the descent slowly for 3 seconds.'
        }
      ],
      cooldown: {
        durationMinutes: 5,
        instructions: ['Lat doorway stretch', 'Cobra abdominal stretch']
      },
      recoveryTip: 'Target 30g protein within 45 minutes of completing this workout.'
    },
    {
      dayNumber: 5,
      dayName: 'Day 5',
      title: isLoss ? 'Cardio Blast & Core Finisher' : 'Full Body Functional Athleticism',
      isRestDay: false,
      estimatedMinutes: 45,
      estimatedCalories: 400,
      targetHeartRateZone: 'Zone 4 (145-160 BPM)',
      warmup: {
        durationMinutes: 6,
        instructions: ['Light jog in place', 'Leg swings', 'Torso rotations']
      },
      exercises: [
        {
          id: 'ex_11',
          name: 'Kettlebell / Dumbbell Swings',
          sets: 4,
          reps: '15-20',
          restSeconds: 60,
          targetMuscle: 'Posterior Chain & Cardio',
          formTips: 'Explosive hip thrust; do not squat the weight.'
        },
        {
          id: 'ex_12',
          name: 'Push-up to Downward Dog',
          sets: 3,
          reps: '10-12',
          restSeconds: 45,
          targetMuscle: 'Chest, Shoulders & Calves',
          formTips: 'Flow smoothly from pushup into stretch.'
        }
      ],
      cooldown: {
        durationMinutes: 5,
        instructions: ['Seated forward bend', 'Deep abdominal breathing']
      },
      recoveryTip: 'Replenish electrolytes and take magnesium before sleep.'
    },
    {
      dayNumber: 6,
      dayName: 'Day 6',
      title: 'Rest & Deep Tissue Recovery',
      isRestDay: true,
      estimatedMinutes: 20,
      estimatedCalories: 100,
      targetHeartRateZone: 'Zone 1 (Rest)',
      warmup: { durationMinutes: 3, instructions: ['Gentle movement'] },
      exercises: [
        {
          id: 'ex_rec_2',
          name: 'Foam Rolling & Targeted Muscle Release',
          sets: 1,
          reps: '15 min',
          restSeconds: 0,
          targetMuscle: 'Fascia & Muscle Tissue',
          formTips: 'Slow passes over glutes, quads, and upper back.'
        }
      ],
      cooldown: { durationMinutes: 5, instructions: ['Legs up the wall pose'] },
      recoveryTip: 'Review your wearable recovery score today.'
    },
    {
      dayNumber: 7,
      dayName: 'Day 7',
      title: 'Aerobic Reset & Mind-Body Restoration',
      isRestDay: true,
      estimatedMinutes: 30,
      estimatedCalories: 160,
      targetHeartRateZone: 'Zone 2 (110-125 BPM)',
      warmup: { durationMinutes: 5, instructions: ['Dynamic mobility'] },
      exercises: [
        {
          id: 'ex_rec_3',
          name: 'Leisurely Walk in Nature or Yoga Flow',
          sets: 1,
          reps: '30 min',
          restSeconds: 0,
          targetMuscle: 'Cardiovascular & Parasympathetic Nervous System',
          formTips: 'Nasal breathing only to stimulate parasympathetic tone.'
        }
      ],
      cooldown: { durationMinutes: 5, instructions: ['Meditation and slow breathing'] },
      recoveryTip: 'Set goals for next week and meal prep wholesome whole foods.'
    }
  ];

  return {
    title: `${user.name}'s Personalized 7-Day Plan`,
    goal: user.fitnessGoal,
    intensity: user.workoutIntensity,
    overview: `A science-backed 7-day program specifically calibrated for ${user.fitnessGoal.replace('_', ' ')} with ${user.workoutIntensity} intensity.`,
    weeklyFocus: isLoss
      ? 'Elevate heart rate zones into Zone 3-4 to maximize excess post-exercise oxygen consumption (EPOC).'
      : 'Maintain steady progressive overload and mechanical tension.',
    days,
  };
}

function refineFallbackPlan(currentPlan: WorkoutPlan, feedback: string) {
  const lower = feedback.toLowerCase();
  const updatedDays = currentPlan.days.map((day) => {
    // If feedback asks for more rest or cardio, tweak accordingly
    if (lower.includes('rest') && day.dayNumber === 5 && !day.isRestDay) {
      return {
        ...day,
        title: 'Active Recovery & Low-Impact Cardio',
        isRestDay: true,
        estimatedMinutes: 25,
        estimatedCalories: 140,
        recoveryTip: 'Added rest day based on user feedback to prevent overtraining.',
      };
    }
    if (lower.includes('cardio') && !day.isRestDay) {
      return {
        ...day,
        estimatedCalories: day.estimatedCalories + 60,
        targetHeartRateZone: 'Zone 4 - Threshold (145-165 BPM)',
        exercises: [
          ...day.exercises,
          {
            id: `ex_cardio_${day.dayNumber}`,
            name: 'High-Intensity Cardio Interval Burst',
            sets: 3,
            reps: '45s on / 15s off',
            restSeconds: 30,
            targetMuscle: 'Cardiovascular Endurance',
            formTips: 'Sprint on bike or row at 85%+ max heart rate.',
          },
        ],
      };
    }
    if (lower.includes('knee') || lower.includes('squat')) {
      return {
        ...day,
        exercises: day.exercises.map((ex) => {
          if (ex.name.toLowerCase().includes('squat') || ex.name.toLowerCase().includes('lunge')) {
            return {
              ...ex,
              name: 'Leg Press (Knee-Friendly Foot Placement) or Glute Bridges',
              formTips: 'Zero knee strain; drive exclusively through heels and glutes.',
            };
          }
          return ex;
        }),
      };
    }
    return day;
  });

  return {
    updatedDays,
    overview: `${currentPlan.overview} (Customized to user feedback)`,
    weeklyFocus: `Refined focus based on: "${feedback}"`,
    changesApplied: `Adapted exercise choices and session dynamics according to "${feedback}".`,
  };
}

function generateFallbackNutrition(user: UserProfile) {
  const weightKg = user.weightUnit === 'lbs' ? user.weight * 0.453592 : user.weight;
  const isLoss = user.fitnessGoal === 'weight_loss';
  const isGain = user.fitnessGoal === 'muscle_gain';

  let baseCalories = Math.round(weightKg * (isLoss ? 26 : isGain ? 36 : 31));
  let proteinGrams = Math.round(weightKg * (isLoss ? 2.2 : isGain ? 2.0 : 1.8));
  let fatGrams = Math.round(weightKg * 0.9);
  let carbsGrams = Math.round((baseCalories - (proteinGrams * 4 + fatGrams * 9)) / 4);

  return {
    goal: user.fitnessGoal,
    dailyCalories: baseCalories,
    macros: {
      proteinGrams,
      carbsGrams,
      fatGrams,
      proteinPercent: Math.round(((proteinGrams * 4) / baseCalories) * 100),
      carbsPercent: Math.round(((carbsGrams * 4) / baseCalories) * 100),
      fatPercent: Math.round(((fatGrams * 9) / baseCalories) * 100),
    },
    hydrationLiters: Number((weightKg * 0.04).toFixed(1)),
    preWorkoutTip: isLoss
      ? 'Small carbohydrate source 45m prior (e.g. apple or rice cake) with black coffee for metabolic focus.'
      : '30-40g complex carbs + 15g whey/plant protein 60m before training to saturate muscle glycogen.',
    postWorkoutTip: isGain
      ? 'Consume 35g fast-digesting protein and 45g simple carbs within 45 minutes for optimal muscle protein synthesis (MPS).'
      : 'Prioritize 30g lean protein with leafy greens and hydration to repair micro-tears without excess calories.',
    recoveryProtocol: 'Aim for 7.5 to 8.5 hours uninterrupted sleep. Wearable metric target: Sleep score > 85, HRV baseline preserved.',
    sampleMealIdeas: [
      {
        meal: 'Meal 1: High-Protein Breakfast',
        description: '3 whole eggs + 2 egg whites scrambled with spinach and sourdough toast.',
        calories: 460,
        protein: 34,
      },
      {
        meal: 'Meal 2: Power Fuel Lunch',
        description: '180g lean chicken breast or tempeh, 1 cup cooked quinoa, roasted broccoli with olive oil.',
        calories: 590,
        protein: 45,
      },
      {
        meal: 'Meal 3: Nutrient-Dense Dinner',
        description: '200g wild salmon fillet or tofu steak, roasted sweet potato wedges, steamed green beans.',
        calories: 620,
        protein: 42,
      },
      {
        meal: 'Meal 4: Evening Recovery Snack',
        description: '1 cup low-fat Greek yogurt with fresh berries and chia seeds.',
        calories: 220,
        protein: 20,
      },
    ],
    generalTip: isLoss
      ? 'Maintain a consistent caloric deficit while prioritizing high protein (2g/kg) to protect lean muscle mass.'
      : isGain
      ? 'Target a steady 300 kcal surplus and distribute protein every 3-4 hours across the day.'
      : 'Focus on 80% whole minimally processed foods and match hydration to your wearable sweat loss.',
  };
}
