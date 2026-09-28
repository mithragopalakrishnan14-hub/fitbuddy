export type FitnessGoal = 'weight_loss' | 'muscle_gain' | 'wellness' | 'endurance' | 'strength';
export type WorkoutIntensity = 'low' | 'medium' | 'high';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type EquipmentType = 'gym' | 'dumbbells' | 'bodyweight';
export type DietaryPreference = 'balanced' | 'high_protein' | 'plant_based' | 'low_carb' | 'keto';
export type WearableDeviceType = 'apple_watch' | 'garmin' | 'whoop' | 'fitbit' | 'samsung';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  weight: number;
  weightUnit: 'kg' | 'lbs';
  fitnessGoal: FitnessGoal;
  workoutIntensity: WorkoutIntensity;
  experienceLevel: ExperienceLevel;
  equipment: EquipmentType;
  daysPerWeek: number;
  dietaryPreference: DietaryPreference;
  injuriesOrNotes?: string;
  updatedAt?: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  targetMuscle: string;
  notes?: string;
  formTips?: string;
  completed?: boolean;
  loggedWeight?: number;
  loggedReps?: number;
}

export interface WorkoutDay {
  dayNumber: number;
  dayName: string;
  title: string;
  isRestDay: boolean;
  estimatedMinutes: number;
  estimatedCalories: number;
  targetHeartRateZone: string;
  warmup: {
    durationMinutes: number;
    instructions: string[];
  };
  exercises: Exercise[];
  cooldown: {
    durationMinutes: number;
    instructions: string[];
  };
  recoveryTip: string;
}

export interface PlanFeedbackItem {
  timestamp: string;
  feedback: string;
  changesApplied: string;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  title: string;
  goal: FitnessGoal;
  intensity: WorkoutIntensity;
  overview: string;
  weeklyFocus: string;
  days: WorkoutDay[];
  version: number;
  feedbackHistory: PlanFeedbackItem[];
  createdAt: string;
  updatedAt: string;
}

export interface NutritionPlan {
  id: string;
  userId: string;
  goal: FitnessGoal;
  dailyCalories: number;
  macros: {
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    proteinPercent: number;
    carbsPercent: number;
    fatPercent: number;
  };
  hydrationLiters: number;
  preWorkoutTip: string;
  postWorkoutTip: string;
  recoveryProtocol: string;
  sampleMealIdeas: Array<{
    meal: string;
    description: string;
    calories: number;
    protein: number;
  }>;
  generalTip: string;
  createdAt: string;
}

export interface WearableState {
  deviceName: string;
  deviceType: WearableDeviceType;
  isConnected: boolean;
  batteryLevel: number;
  lastSyncedAt: string;
  liveHeartRate: number;
  restingHeartRate: number;
  hrZone: string;
  stepsToday: number;
  stepGoal: number;
  activeCalories: number;
  calorieGoal: number;
  recoveryScore: number;
  hrvMs: number;
  sleepHours: number;
  sleepScore: number;
  vo2Max: number;
}

export interface WorkoutLog {
  id: string;
  userId: string;
  planId: string;
  dayNumber: number;
  dayTitle: string;
  durationSeconds: number;
  caloriesBurned: number;
  avgHeartRate: number;
  maxHeartRate: number;
  completedExercisesCount: number;
  totalExercisesCount: number;
  notes?: string;
  createdAt: string;
}
