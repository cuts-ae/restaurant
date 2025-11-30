"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "@/components/icons/plus";
import { Search } from "@/components/icons/search";
import { Edit } from "@/components/icons/edit";
import { Trash } from "@/components/icons/trash";
import { Eye } from "@/components/icons/eye";
import { EyeOff } from "@/components/icons/eye-off";
import { API_ENDPOINTS } from "@/lib/api";
import { NutritionLabel } from "@/components/nutrition-label";
import type { NutritionInfo } from "@/components/nutrition-label";

interface NutritionalInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  base_price: number;
  category: string;
  is_available: boolean;
  prep_time: number;
  nutritional_info?: NutritionalInfo[];
}

export default function MenuPage() {
  const params = useParams();
  const restaurantSlug = decodeURIComponent(params.slug as string);
  // Remove @ from slug for localStorage key
  const cleanSlug = useMemo(
    () =>
      restaurantSlug.startsWith("@")
        ? restaurantSlug.slice(1)
        : restaurantSlug,
    [restaurantSlug]
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    base_price: "",
    category: "",
    prep_time: "",
    nutrition: {
      servingSize: "1 serving",
      servingsPerContainer: undefined as number | undefined,
      calories: 0,
      totalFat: 0,
      saturatedFat: undefined as number | undefined,
      transFat: undefined as number | undefined,
      cholesterol: undefined as number | undefined,
      sodium: 0,
      totalCarbohydrate: 0,
      dietaryFiber: 0,
      totalSugars: 0,
      addedSugars: undefined as number | undefined,
      protein: 0,
      vitaminD: undefined as number | undefined,
      calcium: undefined as number | undefined,
      iron: undefined as number | undefined,
      potassium: undefined as number | undefined,
    },
  });

  const [newItemForm, setNewItemForm] = useState({
    name: "",
    description: "",
    base_price: "",
    category: "",
    prep_time: "",
    nutrition: {
      servingSize: "1 serving",
      servingsPerContainer: undefined as number | undefined,
      calories: 0,
      totalFat: 0,
      saturatedFat: undefined as number | undefined,
      transFat: undefined as number | undefined,
      cholesterol: undefined as number | undefined,
      sodium: 0,
      totalCarbohydrate: 0,
      dietaryFiber: 0,
      totalSugars: 0,
      addedSugars: undefined as number | undefined,
      protein: 0,
      vitaminD: undefined as number | undefined,
      calcium: undefined as number | undefined,
      iron: undefined as number | undefined,
      potassium: undefined as number | undefined,
    },
  });

  useEffect(() => {
    // Get restaurant ID from localStorage first
    const restaurantData = localStorage.getItem(`restaurant-${cleanSlug}`);
    if (restaurantData) {
      try {
        const restaurant = JSON.parse(restaurantData);
        setRestaurantId(restaurant.id);
        return;
      } catch (error) {
        console.error("Failed to parse restaurant data:", error);
      }
    }

    // Fallback: Fetch from API
    const fetchRestaurantId = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        const response = await fetch(API_ENDPOINTS.restaurants.myRestaurants, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const restaurant = data.restaurants?.find(
            (r: { slug: string }) => r.slug === cleanSlug,
          );
          if (restaurant) {
            setRestaurantId(restaurant.id);
            localStorage.setItem(
              `restaurant-${cleanSlug}`,
              JSON.stringify(restaurant),
            );
          } else {
            console.error("Restaurant not found in myRestaurants");
            setIsLoading(false);
          }
        } else {
          console.error("Failed to fetch myRestaurants:", response.status);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch restaurant:", error);
        setIsLoading(false);
      }
    };

    fetchRestaurantId();
  }, [cleanSlug]);

  useEffect(() => {
    if (!restaurantId) return;
    fetchMenuItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const fetchMenuItems = async () => {
    if (!restaurantId) return;

    try {
      const response = await fetch(
        API_ENDPOINTS.restaurants.menuItems(restaurantId),
      );

      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.menuItems || []);
      }
    } catch (error) {
      console.error("Failed to fetch menu items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAvailability = async (itemId: string, currentStatus: boolean) => {
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(
        API_ENDPOINTS.menuItems.toggleAvailability(itemId),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_available: !currentStatus }),
        },
      );

      if (response.ok) {
        await fetchMenuItems();
      } else {
        const error = await response.json();
        alert(
          `Failed to update availability: ${error.error || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Failed to toggle availability:", error);
      alert("Failed to update availability. Please try again.");
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const deleteMenuItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return;
    }

    setUpdatingItems((prev) => new Set(prev).add(itemId));
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(API_ENDPOINTS.menuItems.delete(itemId), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchMenuItems();
      } else {
        const error = await response.json();
        alert(`Failed to delete item: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to delete menu item:", error);
      alert("Failed to delete item. Please try again.");
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const openEditDialog = (item: MenuItem) => {
    setSelectedItem(item);
    const nutrition = item.nutritional_info?.[0];
    setEditForm({
      name: item.name,
      description: item.description,
      base_price: item.base_price.toString(),
      category: item.category,
      prep_time: item.prep_time.toString(),
      nutrition: {
        servingSize: "1 serving",
        servingsPerContainer: undefined,
        calories: nutrition?.calories || 0,
        totalFat: nutrition?.fat || 0,
        saturatedFat: undefined,
        transFat: undefined,
        cholesterol: undefined,
        sodium: 0,
        totalCarbohydrate: nutrition?.carbohydrates || 0,
        dietaryFiber: 0,
        totalSugars: 0,
        addedSugars: undefined,
        protein: nutrition?.protein || 0,
        vitaminD: undefined,
        calcium: undefined,
        iron: undefined,
        potassium: undefined,
      },
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setUpdatingItems((prev) => new Set(prev).add(selectedItem.id));
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(
        API_ENDPOINTS.menuItems.update(selectedItem.id),
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editForm.name,
            description: editForm.description,
            base_price: parseFloat(editForm.base_price),
            category: editForm.category,
            prep_time: parseInt(editForm.prep_time),
          }),
        },
      );

      if (response.ok) {
        await fetchMenuItems();
        setEditDialogOpen(false);
        setSelectedItem(null);
      } else {
        const error = await response.json();
        alert(`Failed to update item: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to update menu item:", error);
      alert("Failed to update item. Please try again.");
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(selectedItem.id);
        return newSet;
      });
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(
        API_ENDPOINTS.menuItems.create(restaurantId),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newItemForm.name,
            description: newItemForm.description,
            base_price: parseFloat(newItemForm.base_price),
            category: newItemForm.category,
            prep_time: parseInt(newItemForm.prep_time),
          }),
        },
      );

      if (response.ok) {
        await fetchMenuItems();
        setAddDialogOpen(false);
        // Reset form
        setNewItemForm({
          name: "",
          description: "",
          base_price: "",
          category: "",
          prep_time: "",
          nutrition: {
            servingSize: "1 serving",
            servingsPerContainer: undefined,
            calories: 0,
            totalFat: 0,
            saturatedFat: undefined,
            transFat: undefined,
            cholesterol: undefined,
            sodium: 0,
            totalCarbohydrate: 0,
            dietaryFiber: 0,
            totalSugars: 0,
            addedSugars: undefined,
            protein: 0,
            vitaminD: undefined,
            calcium: undefined,
            iron: undefined,
            potassium: undefined,
          },
        });
      } else {
        const error = await response.json();
        alert(`Failed to create item: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to create menu item:", error);
      alert("Failed to create item. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getCategoryEmoji = (category: string) => {
    const cat = category.toLowerCase();

    // Mediterranean and Wraps
    if (cat.includes("mediterranean") || cat.includes("wrap")) return "🌯";
    if (cat.includes("kebab") || cat.includes("shawarma")) return "🍗";

    // Chicken dishes
    if (cat.includes("chicken") || cat.includes("poultry")) return "🍗";
    if (cat.includes("grilled chicken")) return "🔥";

    // Salads
    if (cat.includes("salad") || cat.includes("caesar")) return "🥗";

    // Pasta and Italian
    if (cat.includes("pasta") || cat.includes("noodle")) return "🍝";

    // Sandwiches
    if (cat.includes("sandwich")) return "🥪";

    // Burgers
    if (cat.includes("burger") || cat.includes("beef")) return "🍔";

    // Pizza
    if (cat.includes("pizza")) return "🍕";

    // Seafood
    if (cat.includes("seafood") || cat.includes("fish") || cat.includes("shrimp") || cat.includes("salmon")) return "🐟";

    // Vegetarian
    if (cat.includes("vegetarian") || cat.includes("vegan") || cat.includes("veggie")) return "🥬";

    // Smoothies and Shakes
    if (cat.includes("smoothie") || cat.includes("shake") || cat.includes("blend")) return "🥤";

    // Breakfast items
    if (cat.includes("breakfast") || cat.includes("egg") || cat.includes("omelet")) return "🍳";

    // Desserts and Sweets
    if (cat.includes("dessert") || cat.includes("sweet") || cat.includes("cake") || cat.includes("cookie")) return "🍰";
    if (cat.includes("ice cream") || cat.includes("frozen")) return "🍦";

    // Beverages and Drinks
    if (cat.includes("beverage") || cat.includes("drink") || cat.includes("coffee") || cat.includes("tea")) return "☕";
    if (cat.includes("juice") || cat.includes("fresh")) return "🧃";

    // Appetizers and Starters
    if (cat.includes("appetizer") || cat.includes("starter") || cat.includes("tapas")) return "🥘";

    // Sides and Fries
    if (cat.includes("side") || cat.includes("fries") || cat.includes("chips")) return "🍟";
    if (cat.includes("soup")) return "🍲";

    // Main courses and Entrees
    if (cat.includes("main") || cat.includes("entree")) return "🍽️";
    if (cat.includes("lunch") || cat.includes("dinner")) return "🍽️";

    // Snacks
    if (cat.includes("snack") || cat.includes("popcorn")) return "🍿";

    // Rice and Grain dishes
    if (cat.includes("rice") || cat.includes("risotto") || cat.includes("pilaf")) return "🍚";

    // Bread and Bakery
    if (cat.includes("bread") || cat.includes("bakery")) return "🥖";

    // Default fallback
    return "🍽️";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-lg text-muted-foreground">Loading menu items...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tighter">Menu Management</h2>
          <p className="text-muted-foreground">
            Manage your menu items and nutritional information
          </p>
        </div>
        <Button className="gap-2 shadow-lg" onClick={() => setAddDialogOpen(true)}>
          <Plus size={20} />
          Add Menu Item
        </Button>
      </div>

      <div className="relative">
        <Search size={24} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search menu items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 bg-background/50 backdrop-blur-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredItems.map((item, index) => {
          const isUpdating = updatingItems.has(item.id);
          const nutrition = item.nutritional_info?.[0];

          return (
            <Card
              key={item.id}
              className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              <CardContent className="p-6 flex flex-col h-full">
                {/* Icon and Name */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-4xl flex-shrink-0">
                    {getCategoryEmoji(item.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg leading-tight">
                      {item.name}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-auto">
                  {item.description || "No description"}
                </p>

                {/* Spacer to push content to bottom */}
                <div className="mt-4 space-y-3">
                  {/* Nutrition and Price */}
                  <div className="flex items-center justify-between">
                    {/* Left: Calories and Protein */}
                    <div className="flex flex-col gap-1">
                      {nutrition ? (
                        <>
                          <p className="text-sm text-foreground">
                            {nutrition.calories} calories
                          </p>
                          <p className="text-sm text-foreground">
                            {nutrition.protein}g protein
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No nutrition data
                        </p>
                      )}
                    </div>

                    {/* Right: Price */}
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        AED {Number(item.base_price).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={item.is_available ? "default" : "outline"}
                      className="flex-1 gap-2"
                      onClick={() =>
                        toggleAvailability(item.id, item.is_available)
                      }
                      disabled={isUpdating}
                    >
                      {item.is_available ? (
                        <>
                          <Eye size={16} />
                          Available
                        </>
                      ) : (
                        <>
                          <EyeOff size={16} />
                          Hidden
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-2"
                      onClick={() => openEditDialog(item)}
                      disabled={isUpdating}
                    >
                      <Edit size={16} />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMenuItem(item.id, item.name)}
                      disabled={isUpdating}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery
              ? "No menu items found matching your search"
              : "No menu items yet. Add your first menu item to get started."}
          </p>
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>
              Update the details of your menu item. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
              {/* Left Column - Edit Fields */}
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="base_price">Price (AED)</Label>
                    <Input
                      id="base_price"
                      type="number"
                      step="0.01"
                      value={editForm.base_price}
                      onChange={(e) =>
                        setEditForm({ ...editForm, base_price: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="prep_time">Prep Time (min)</Label>
                    <Input
                      id="prep_time"
                      type="number"
                      value={editForm.prep_time}
                      onChange={(e) =>
                        setEditForm({ ...editForm, prep_time: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Nutrition Fields */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold mb-3">Nutrition Information</h3>

                  {/* Serving Info */}
                  <div className="grid gap-2 mb-4">
                    <Label htmlFor="servingsPerContainer">Servings Per Container (optional)</Label>
                    <Input
                      id="servingsPerContainer"
                      type="number"
                      placeholder="Leave empty if not applicable"
                      value={editForm.nutrition.servingsPerContainer || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          nutrition: {
                            ...editForm.nutrition,
                            servingsPerContainer: e.target.value ? parseInt(e.target.value) : undefined,
                          },
                        })
                      }
                    />
                  </div>

                  {/* Core Nutrients */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="calories">Calories *</Label>
                      <Input
                        id="calories"
                        type="number"
                        value={editForm.nutrition.calories}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            nutrition: {
                              ...editForm.nutrition,
                              calories: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="protein">Protein (g) *</Label>
                      <Input
                        id="protein"
                        type="number"
                        value={editForm.nutrition.protein}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            nutrition: {
                              ...editForm.nutrition,
                              protein: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="totalCarbohydrate">Total Carbs (g) *</Label>
                      <Input
                        id="totalCarbohydrate"
                        type="number"
                        value={editForm.nutrition.totalCarbohydrate}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            nutrition: {
                              ...editForm.nutrition,
                              totalCarbohydrate: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="totalFat">Total Fat (g) *</Label>
                      <Input
                        id="totalFat"
                        type="number"
                        value={editForm.nutrition.totalFat}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            nutrition: {
                              ...editForm.nutrition,
                              totalFat: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="saturatedFat">Saturated Fat (g)</Label>
                      <Input
                        id="saturatedFat"
                        type="number"
                        placeholder="Optional"
                        value={editForm.nutrition.saturatedFat || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            nutrition: {
                              ...editForm.nutrition,
                              saturatedFat: e.target.value ? parseInt(e.target.value) : undefined,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="transFat">Trans Fat (g)</Label>
                      <Input
                        id="transFat"
                        type="number"
                        placeholder="Optional"
                        value={editForm.nutrition.transFat || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            nutrition: {
                              ...editForm.nutrition,
                              transFat: e.target.value ? parseInt(e.target.value) : undefined,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cholesterol">Cholesterol (mg)</Label>
                      <Input
                        id="cholesterol"
                        type="number"
                        placeholder="Optional"
                        value={editForm.nutrition.cholesterol || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            nutrition: {
                              ...editForm.nutrition,
                              cholesterol: e.target.value ? parseInt(e.target.value) : undefined,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sodium">Sodium (mg) *</Label>
                      <Input
                        id="sodium"
                        type="number"
                        value={editForm.nutrition.sodium}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            nutrition: {
                              ...editForm.nutrition,
                              sodium: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dietaryFiber">Dietary Fiber (g) *</Label>
                      <Input
                        id="dietaryFiber"
                        type="number"
                        value={editForm.nutrition.dietaryFiber}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            nutrition: {
                              ...editForm.nutrition,
                              dietaryFiber: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="totalSugars">Total Sugars (g) *</Label>
                      <Input
                        id="totalSugars"
                        type="number"
                        value={editForm.nutrition.totalSugars}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            nutrition: {
                              ...editForm.nutrition,
                              totalSugars: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="addedSugars">Added Sugars (g)</Label>
                      <Input
                        id="addedSugars"
                        type="number"
                        placeholder="Optional"
                        value={editForm.nutrition.addedSugars || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            nutrition: {
                              ...editForm.nutrition,
                              addedSugars: e.target.value ? parseInt(e.target.value) : undefined,
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Vitamins & Minerals */}
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-xs font-semibold mb-2 text-muted-foreground">Vitamins & Minerals (Optional)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor="vitaminD">Vitamin D (mcg)</Label>
                        <Input
                          id="vitaminD"
                          type="number"
                          placeholder="Optional"
                          value={editForm.nutrition.vitaminD || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              nutrition: {
                                ...editForm.nutrition,
                                vitaminD: e.target.value ? parseInt(e.target.value) : undefined,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="calcium">Calcium (mg)</Label>
                        <Input
                          id="calcium"
                          type="number"
                          placeholder="Optional"
                          value={editForm.nutrition.calcium || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              nutrition: {
                                ...editForm.nutrition,
                                calcium: e.target.value ? parseInt(e.target.value) : undefined,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="iron">Iron (mg)</Label>
                        <Input
                          id="iron"
                          type="number"
                          placeholder="Optional"
                          value={editForm.nutrition.iron || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              nutrition: {
                                ...editForm.nutrition,
                                iron: e.target.value ? parseInt(e.target.value) : undefined,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="potassium">Potassium (mg)</Label>
                        <Input
                          id="potassium"
                          type="number"
                          placeholder="Optional"
                          value={editForm.nutrition.potassium || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              nutrition: {
                                ...editForm.nutrition,
                                potassium: e.target.value ? parseInt(e.target.value) : undefined,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Nutrition Label Preview */}
              <div className="flex flex-col items-center justify-start">
                <h3 className="text-sm font-semibold mb-3">FDA Label Preview</h3>
                <div className="scale-90 origin-top">
                  <NutritionLabel nutrition={editForm.nutrition} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  selectedItem ? updatingItems.has(selectedItem.id) : false
                }
              >
                {selectedItem && updatingItems.has(selectedItem.id)
                  ? "Saving..."
                  : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Menu Item Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
            <DialogDescription>
              Create a new menu item for your restaurant.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="new-name">Name</Label>
                <Input
                  id="new-name"
                  value={newItemForm.name}
                  onChange={(e) =>
                    setNewItemForm({ ...newItemForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-description">Description</Label>
                <Textarea
                  id="new-description"
                  value={newItemForm.description}
                  onChange={(e) =>
                    setNewItemForm({ ...newItemForm, description: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-base_price">Price (AED)</Label>
                  <Input
                    id="new-base_price"
                    type="number"
                    step="0.01"
                    value={newItemForm.base_price}
                    onChange={(e) =>
                      setNewItemForm({ ...newItemForm, base_price: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-prep_time">Prep Time (min)</Label>
                  <Input
                    id="new-prep_time"
                    type="number"
                    value={newItemForm.prep_time}
                    onChange={(e) =>
                      setNewItemForm({ ...newItemForm, prep_time: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-category">Category</Label>
                <Input
                  id="new-category"
                  value={newItemForm.category}
                  onChange={(e) =>
                    setNewItemForm({ ...newItemForm, category: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
