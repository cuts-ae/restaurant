"use client";

import { useState, useEffect } from "react";
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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api";

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
  const restaurantSlug = params.slug as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    base_price: "",
    category: "",
    prep_time: "",
  });

  useEffect(() => {
    const fetchRestaurantId = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        const response = await fetch(
          API_ENDPOINTS.restaurants.details(`@${restaurantSlug}`),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setRestaurantId(data.restaurant?.id || "");
        }
      } catch (error) {
        console.error("Failed to fetch restaurant:", error);
      }
    };

    fetchRestaurantId();
  }, [restaurantSlug]);

  useEffect(() => {
    if (!restaurantId) return;
    fetchMenuItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const fetchMenuItems = async () => {
    if (!restaurantId) return;

    try {
      const response = await fetch(
        API_ENDPOINTS.restaurants.menuItems(restaurantId)
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
        }
      );

      if (response.ok) {
        await fetchMenuItems();
      } else {
        const error = await response.json();
        alert(`Failed to update availability: ${error.error || "Unknown error"}`);
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
      const response = await fetch(
        API_ENDPOINTS.menuItems.delete(itemId),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
    setEditForm({
      name: item.name,
      description: item.description,
      base_price: item.base_price.toString(),
      category: item.category,
      prep_time: item.prep_time.toString(),
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
        }
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

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryEmoji = (category: string) => {
    const emojiMap: { [key: string]: string } = {
      breakfast: "🍳",
      lunch: "🍽️",
      dinner: "🍖",
      snacks: "🥨",
      beverages: "🥤",
    };
    return emojiMap[category.toLowerCase()] || "🍴";
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
          <h2 className="text-3xl font-bold tracking-tight">Menu Management</h2>
          <p className="text-muted-foreground">
            Manage your menu items and nutritional information
          </p>
        </div>
        <Button className="gap-2 shadow-lg">
          <Plus className="w-4 h-4" />
          Add Menu Item
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
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
              className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-4xl">
                      {getCategoryEmoji(item.category)}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg leading-none">
                        {item.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {item.category}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.description || "No description"}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {nutrition && (
                      <>
                        <span>{nutrition.calories} cal</span>
                        <span>{nutrition.protein}g protein</span>
                      </>
                    )}
                    {!nutrition && <span className="text-xs italic">No nutrition data</span>}
                  </div>
                  <p className="text-xl font-bold">AED {item.base_price.toFixed(2)}</p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant={item.is_available ? "default" : "outline"}
                    className="flex-1 gap-2"
                    onClick={() => toggleAvailability(item.id, item.is_available)}
                    disabled={isUpdating}
                  >
                    {item.is_available ? (
                      <>
                        <Eye className="w-3 h-3" />
                        Available
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
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
                    <Edit className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteMenuItem(item.id, item.name)}
                    disabled={isUpdating}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
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
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>
              Update the details of your menu item. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
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
                disabled={selectedItem ? updatingItems.has(selectedItem.id) : false}
              >
                {selectedItem && updatingItems.has(selectedItem.id)
                  ? "Saving..."
                  : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
