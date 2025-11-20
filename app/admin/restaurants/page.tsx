"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Users,
  Eye,
  Edit,
  Power,
  PowerOff,
} from "@/components/icons";
import { capitalizeStatus } from "@/lib/utils";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  owner: {
    name: string;
    email: string;
    phone: string;
  };
  location: {
    address: string;
    city: string;
    area: string;
  };
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  stats: {
    totalOrders: number;
    revenue: number;
    rating: number;
    reviews: number;
  };
  status: "active" | "inactive" | "pending";
  joinedDate: string;
}

export default function AdminRestaurantsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([
    {
      id: "1",
      name: "The Butcher Shop",
      slug: "the-butcher-shop",
      description: "Premium cuts and fine dining experience",
      owner: {
        name: "Ahmed Al Maktoum",
        email: "owner1@cuts.ae",
        phone: "+971 50 123 4567",
      },
      location: {
        address: "Sheikh Zayed Road, Trade Centre",
        city: "Dubai",
        area: "DIFC",
      },
      contact: {
        phone: "+971 4 123 4567",
        email: "contact@butchershop.ae",
        website: "www.butchershop.ae",
      },
      stats: {
        totalOrders: 456,
        revenue: 125430,
        rating: 4.8,
        reviews: 234,
      },
      status: "active",
      joinedDate: "2024-01-15",
    },
    {
      id: "2",
      name: "Prime Cuts",
      slug: "prime-cuts",
      description: "Authentic steakhouse with local flavors",
      owner: {
        name: "Fatima Hassan",
        email: "owner2@cuts.ae",
        phone: "+971 55 987 6543",
      },
      location: {
        address: "Marina Walk",
        city: "Dubai",
        area: "Dubai Marina",
      },
      contact: {
        phone: "+971 4 987 6543",
        email: "info@primecuts.ae",
        website: "www.primecuts.ae",
      },
      stats: {
        totalOrders: 389,
        revenue: 98750,
        rating: 4.6,
        reviews: 187,
      },
      status: "active",
      joinedDate: "2024-02-20",
    },
    {
      id: "3",
      name: "Grill House",
      slug: "grill-house",
      description: "Traditional grilling with modern twist",
      owner: {
        name: "Mohammed Khan",
        email: "owner3@cuts.ae",
        phone: "+971 52 456 7890",
      },
      location: {
        address: "Al Wasl Road",
        city: "Dubai",
        area: "Jumeirah",
      },
      contact: {
        phone: "+971 4 456 7890",
        email: "hello@grillhouse.ae",
        website: "www.grillhouse.ae",
      },
      stats: {
        totalOrders: 298,
        revenue: 67890,
        rating: 4.5,
        reviews: 145,
      },
      status: "active",
      joinedDate: "2024-03-10",
    },
    {
      id: "4",
      name: "Meat & Greet",
      slug: "meat-and-greet",
      description: "Casual dining with premium meats",
      owner: {
        name: "Omar Abdullah",
        email: "owner4@cuts.ae",
        phone: "+971 50 876 5432",
      },
      location: {
        address: "The Beach, JBR",
        city: "Dubai",
        area: "Jumeirah Beach Residence",
      },
      contact: {
        phone: "+971 4 876 5432",
        email: "contact@meatandgreet.ae",
        website: "www.meatandgreet.ae",
      },
      stats: {
        totalOrders: 234,
        revenue: 54320,
        rating: 4.4,
        reviews: 98,
      },
      status: "active",
      joinedDate: "2024-04-05",
    },
    {
      id: "5",
      name: "Sizzle & Spice",
      slug: "sizzle-and-spice",
      description: "Fusion cuisine meets traditional grilling",
      owner: {
        name: "Aisha Patel",
        email: "owner5@cuts.ae",
        phone: "+971 56 234 5678",
      },
      location: {
        address: "City Walk",
        city: "Dubai",
        area: "Al Wasl",
      },
      contact: {
        phone: "+971 4 234 5678",
        email: "info@sizzlespice.ae",
        website: "www.sizzlespice.ae",
      },
      stats: {
        totalOrders: 187,
        revenue: 43210,
        rating: 4.7,
        reviews: 112,
      },
      status: "active",
      joinedDate: "2024-05-12",
    },
    {
      id: "6",
      name: "The Grill Masters",
      slug: "the-grill-masters",
      description: "Award-winning barbecue specialists",
      owner: {
        name: "Khalid Al Zaabi",
        email: "owner6@cuts.ae",
        phone: "+971 55 345 6789",
      },
      location: {
        address: "Mall of the Emirates",
        city: "Dubai",
        area: "Al Barsha",
      },
      contact: {
        phone: "+971 4 345 6789",
        email: "contact@grillmasters.ae",
        website: "www.grillmasters.ae",
      },
      stats: {
        totalOrders: 345,
        revenue: 87650,
        rating: 4.9,
        reviews: 276,
      },
      status: "active",
      joinedDate: "2024-01-28",
    },
  ]);

  const filteredRestaurants = restaurants.filter(
    (restaurant) =>
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.location.area.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleViewDetails = (restaurant: Restaurant) => {
    router.push(`/restaurant/${restaurant.slug}`);
  };

  const handleEdit = (restaurant: Restaurant) => {
    alert(`Edit functionality for ${restaurant.name}\n\nThis would open an edit dialog with:\n- Restaurant details\n- Menu management\n- Settings configuration\n\nRestaurant ID: ${restaurant.id}`);
  };

  const handleToggleStatus = (restaurant: Restaurant) => {
    const newStatus = restaurant.status === "active" ? "inactive" : "active";

    setRestaurants((prev) =>
      prev.map((r) =>
        r.id === restaurant.id ? { ...r, status: newStatus } : r
      )
    );

    alert(`Restaurant "${restaurant.name}" has been ${newStatus === "active" ? "activated" : "deactivated"}`);
  };

  const handleAddRestaurant = () => {
    alert("Add Restaurant functionality\n\nThis would open a form to create a new restaurant with:\n- Basic information (name, description)\n- Owner details\n- Location information\n- Contact details");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restaurants</h1>
          <p className="text-muted-foreground mt-2">
            Manage all restaurants on the platform
          </p>
        </div>
        <Button onClick={handleAddRestaurant}>Add Restaurant</Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by restaurant name, owner, or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Restaurants Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRestaurants.map((restaurant) => (
          <Card
            key={restaurant.id}
            className="hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">
                      {restaurant.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={getStatusColor(restaurant.status)}
                    >
                      {capitalizeStatus(restaurant.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {restaurant.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(restaurant.joinedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {restaurant.stats.totalOrders}
                  </p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {(restaurant.stats.revenue / 1000).toFixed(0)}K
                  </p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <p className="text-2xl font-bold">
                      {restaurant.stats.rating}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {restaurant.stats.reviews}
                  </p>
                  <p className="text-xs text-muted-foreground">Reviews</p>
                </div>
              </div>

              {/* Owner Info */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Owner Information
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{restaurant.owner.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {restaurant.owner.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {restaurant.owner.phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Location
                </h4>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p>{restaurant.location.address}</p>
                    <p className="text-muted-foreground">
                      {restaurant.location.area}, {restaurant.location.city}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Contact
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {restaurant.contact.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {restaurant.contact.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {restaurant.contact.website}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  size="sm"
                  onClick={() => handleViewDetails(restaurant)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  size="sm"
                  onClick={() => handleEdit(restaurant)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(restaurant)}
                  className={
                    restaurant.status === "active"
                      ? "text-red-600 hover:bg-red-50"
                      : "text-green-600 hover:bg-green-50"
                  }
                >
                  {restaurant.status === "active" ? (
                    <PowerOff className="h-4 w-4" />
                  ) : (
                    <Power className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRestaurants.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No restaurants found matching your search
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
