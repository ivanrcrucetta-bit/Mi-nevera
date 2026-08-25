export type Unit = "g" | "ud";
export type Meal = "breakfast" | "lunch" | "dinner";
export type Method = "grill" | "oven" | "stovetop" | "salad";
export type KcalBand = "balanced" | "hearty";
export type FoodKind = "protein" | "carb" | "produce" | "other";
export type SlotStatus = "planned" | "cooked";
export type Stars = 1 | 2 | 3 | 4 | 5;

export type Item = {
  id: string;
  name: string;
  qty: number;
  unit: Unit;
};

export type PlannerConfig = {
  days: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  meals: Meal[];
  servings: 1 | 2 | 3 | 4 | 5 | 6;
  startDate: string;
};

export type Ingredient = {
  name: string;
  qty: number;
  unit: Unit;
};

export type Macros = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type Recipe = {
  id: string;
  title: string;
  protein: string;
  carb: string;
  fiber: string;
  method: Method;
  kcalBand: KcalBand;
  image: string;
  time: string;
  servingsBase: 2;
  ingredients: Ingredient[];
  optionalIngredients: Ingredient[];
  optionalSteps?: string[];
  steps: string[];
};

export type MenuSlot = {
  id: string;
  date: string;
  meal: Meal;
  recipe: Recipe;
  status: SlotStatus;
};

export type MenuPlan = {
  id: string;
  createdAt: string;
  config: PlannerConfig;
  slots: MenuSlot[];
};

export type HistoryEntry = {
  recipeId: string;
  title: string;
  at: string;
  cooked: boolean;
};

export type Food = {
  name: string;
  emoji: string;
  kind: FoodKind;
  unit: Unit;
  aliases?: string[];
  shortName: string;
};
