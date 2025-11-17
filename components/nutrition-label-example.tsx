import { NutritionLabel } from "./nutrition-label"

export function NutritionLabelExample() {
  // Example nutrition data for a grilled chicken dish
  const chickenNutrition = {
    servingSize: "1 breast (200g)",
    servingsPerContainer: 1,
    calories: 284,
    totalFat: 6,
    saturatedFat: 1.7,
    transFat: 0,
    cholesterol: 142,
    sodium: 125,
    totalCarbohydrate: 0,
    dietaryFiber: 0,
    totalSugars: 0,
    addedSugars: 0,
    protein: 53,
    vitaminD: 0.1,
    calcium: 15,
    iron: 1.3,
    potassium: 458,
  }

  const allergens = ["None"]

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Nutrition Label Example</h1>
      <NutritionLabel nutrition={chickenNutrition} allergens={allergens} />
    </div>
  )
}

// Example 2: Pasta with allergens
export function PastaDishExample() {
  const pastaNutrition = {
    servingSize: "1 cup (250g)",
    servingsPerContainer: 2,
    calories: 420,
    totalFat: 14,
    saturatedFat: 6,
    transFat: 0,
    cholesterol: 35,
    sodium: 680,
    totalCarbohydrate: 58,
    dietaryFiber: 4,
    totalSugars: 8,
    addedSugars: 2,
    protein: 15,
    calcium: 120,
    iron: 2.5,
  }

  const allergens = ["Wheat (Gluten)", "Milk", "Eggs"]

  return <NutritionLabel nutrition={pastaNutrition} allergens={allergens} />
}

// Example 3: Minimal data (without optional fields)
export function MinimalExample() {
  const minimalNutrition = {
    servingSize: "1 salad (150g)",
    calories: 180,
    totalFat: 12,
    sodium: 320,
    totalCarbohydrate: 15,
    dietaryFiber: 3,
    totalSugars: 6,
    protein: 4,
  }

  return (
    <NutritionLabel
      nutrition={minimalNutrition}
      allergens={["Tree Nuts"]}
      showDailyValues={true}
    />
  )
}
