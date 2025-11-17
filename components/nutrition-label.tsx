import * as React from "react"
import { cn } from "@/lib/utils"

export interface NutritionInfo {
  servingSize: string
  servingsPerContainer?: number
  calories: number
  totalFat: number
  saturatedFat?: number
  transFat?: number
  cholesterol?: number
  sodium: number
  totalCarbohydrate: number
  dietaryFiber: number
  totalSugars: number
  addedSugars?: number
  protein: number
  vitaminD?: number
  calcium?: number
  iron?: number
  potassium?: number
}

export interface NutritionLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  nutrition: NutritionInfo
  allergens?: string[]
  showDailyValues?: boolean
}

const NutritionLabel = React.forwardRef<HTMLDivElement, NutritionLabelProps>(
  ({ className, nutrition, allergens = [], showDailyValues = true, ...props }, ref) => {
    // Calculate % Daily Values based on 2000 calorie diet
    const calculateDV = (value: number, dailyValue: number): number => {
      return Math.round((value / dailyValue) * 100)
    }

    const dvFat = calculateDV(nutrition.totalFat, 78)
    const dvSaturatedFat = nutrition.saturatedFat ? calculateDV(nutrition.saturatedFat, 20) : null
    const dvCholesterol = nutrition.cholesterol ? calculateDV(nutrition.cholesterol, 300) : null
    const dvSodium = calculateDV(nutrition.sodium, 2300)
    const dvCarbs = calculateDV(nutrition.totalCarbohydrate, 275)
    const dvFiber = calculateDV(nutrition.dietaryFiber, 28)
    const dvAddedSugars = nutrition.addedSugars ? calculateDV(nutrition.addedSugars, 50) : null

    return (
      <div
        ref={ref}
        className={cn(
          "w-full max-w-[280px] border-2 border-black bg-white p-2 font-sans text-black",
          className
        )}
        {...props}
      >
        {/* Title */}
        <div className="border-b-8 border-black pb-1">
          <h2 className="text-3xl font-black leading-none tracking-tight">
            Nutrition Facts
          </h2>
        </div>

        {/* Serving Size */}
        <div className="border-b-[1px] border-black py-1 text-xs">
          {nutrition.servingsPerContainer && (
            <div className="font-normal">
              {nutrition.servingsPerContainer} servings per container
            </div>
          )}
          <div className="font-bold">
            Serving size <span className="font-normal">{nutrition.servingSize}</span>
          </div>
        </div>

        {/* Calories */}
        <div className="border-b-[6px] border-black py-1">
          <div className="flex items-end justify-between">
            <span className="text-xs font-bold">Amount per serving</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black leading-none">Calories</span>
            <span className="text-4xl font-black leading-none">{nutrition.calories}</span>
          </div>
        </div>

        {/* Daily Value Header */}
        {showDailyValues && (
          <div className="border-b-[1px] border-black py-[2px]">
            <div className="text-right text-[10px] font-bold">% Daily Value*</div>
          </div>
        )}

        {/* Nutrients */}
        <div className="border-b-[6px] border-black text-xs">
          {/* Total Fat */}
          <div className="flex justify-between border-b-[1px] border-black py-[2px]">
            <div>
              <span className="font-bold">Total Fat </span>
              <span className="font-normal">{nutrition.totalFat}g</span>
            </div>
            {showDailyValues && <div className="font-bold">{dvFat}%</div>}
          </div>

          {/* Saturated Fat */}
          {nutrition.saturatedFat !== undefined && (
            <div className="flex justify-between border-b-[1px] border-black py-[2px] pl-4">
              <div>
                <span className="font-normal">Saturated Fat </span>
                <span className="font-normal">{nutrition.saturatedFat}g</span>
              </div>
              {showDailyValues && dvSaturatedFat !== null && (
                <div className="font-bold">{dvSaturatedFat}%</div>
              )}
            </div>
          )}

          {/* Trans Fat */}
          {nutrition.transFat !== undefined && (
            <div className="flex justify-between border-b-[1px] border-black py-[2px] pl-4">
              <div>
                <span className="font-normal italic">Trans Fat </span>
                <span className="font-normal">{nutrition.transFat}g</span>
              </div>
            </div>
          )}

          {/* Cholesterol */}
          {nutrition.cholesterol !== undefined && (
            <div className="flex justify-between border-b-[1px] border-black py-[2px]">
              <div>
                <span className="font-bold">Cholesterol </span>
                <span className="font-normal">{nutrition.cholesterol}mg</span>
              </div>
              {showDailyValues && dvCholesterol !== null && (
                <div className="font-bold">{dvCholesterol}%</div>
              )}
            </div>
          )}

          {/* Sodium */}
          <div className="flex justify-between border-b-[1px] border-black py-[2px]">
            <div>
              <span className="font-bold">Sodium </span>
              <span className="font-normal">{nutrition.sodium}mg</span>
            </div>
            {showDailyValues && <div className="font-bold">{dvSodium}%</div>}
          </div>

          {/* Total Carbohydrate */}
          <div className="flex justify-between border-b-[1px] border-black py-[2px]">
            <div>
              <span className="font-bold">Total Carbohydrate </span>
              <span className="font-normal">{nutrition.totalCarbohydrate}g</span>
            </div>
            {showDailyValues && <div className="font-bold">{dvCarbs}%</div>}
          </div>

          {/* Dietary Fiber */}
          <div className="flex justify-between border-b-[1px] border-black py-[2px] pl-4">
            <div>
              <span className="font-normal">Dietary Fiber </span>
              <span className="font-normal">{nutrition.dietaryFiber}g</span>
            </div>
            {showDailyValues && <div className="font-bold">{dvFiber}%</div>}
          </div>

          {/* Total Sugars */}
          <div className="flex justify-between border-b-[1px] border-black py-[2px] pl-4">
            <div>
              <span className="font-normal">Total Sugars </span>
              <span className="font-normal">{nutrition.totalSugars}g</span>
            </div>
          </div>

          {/* Added Sugars */}
          {nutrition.addedSugars !== undefined && (
            <div className="flex justify-between border-b-[1px] border-black py-[2px] pl-8">
              <div>
                <span className="font-normal">Includes {nutrition.addedSugars}g Added Sugars</span>
              </div>
              {showDailyValues && dvAddedSugars !== null && (
                <div className="font-bold">{dvAddedSugars}%</div>
              )}
            </div>
          )}

          {/* Protein */}
          <div className="flex justify-between py-[2px]">
            <div>
              <span className="font-bold">Protein </span>
              <span className="font-normal">{nutrition.protein}g</span>
            </div>
          </div>
        </div>

        {/* Additional Vitamins & Minerals (Optional) */}
        {(nutrition.vitaminD !== undefined ||
          nutrition.calcium !== undefined ||
          nutrition.iron !== undefined ||
          nutrition.potassium !== undefined) && (
          <div className="border-b-[6px] border-black py-2 text-xs">
            {nutrition.vitaminD !== undefined && (
              <div className="flex justify-between border-b-[1px] border-black py-[2px]">
                <span>Vitamin D {nutrition.vitaminD}mcg</span>
                {showDailyValues && (
                  <span className="font-bold">{calculateDV(nutrition.vitaminD, 20)}%</span>
                )}
              </div>
            )}
            {nutrition.calcium !== undefined && (
              <div className="flex justify-between border-b-[1px] border-black py-[2px]">
                <span>Calcium {nutrition.calcium}mg</span>
                {showDailyValues && (
                  <span className="font-bold">{calculateDV(nutrition.calcium, 1300)}%</span>
                )}
              </div>
            )}
            {nutrition.iron !== undefined && (
              <div className="flex justify-between border-b-[1px] border-black py-[2px]">
                <span>Iron {nutrition.iron}mg</span>
                {showDailyValues && (
                  <span className="font-bold">{calculateDV(nutrition.iron, 18)}%</span>
                )}
              </div>
            )}
            {nutrition.potassium !== undefined && (
              <div className="flex justify-between py-[2px]">
                <span>Potassium {nutrition.potassium}mg</span>
                {showDailyValues && (
                  <span className="font-bold">{calculateDV(nutrition.potassium, 4700)}%</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Daily Value Footnote */}
        {showDailyValues && (
          <div className="border-b-[1px] border-black py-2 text-[9px] leading-tight">
            * The % Daily Value (DV) tells you how much a nutrient in a serving of food
            contributes to a daily diet. 2,000 calories a day is used for general nutrition
            advice.
          </div>
        )}

        {/* Allergens */}
        {allergens.length > 0 && (
          <div className="mt-2 pt-2">
            <div className="text-xs font-bold uppercase tracking-wide">Allergens:</div>
            <div className="mt-1 text-xs font-normal">
              {allergens.join(", ")}
            </div>
          </div>
        )}
      </div>
    )
  }
)
NutritionLabel.displayName = "NutritionLabel"

export { NutritionLabel }
