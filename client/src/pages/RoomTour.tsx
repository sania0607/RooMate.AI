import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import { 
  MapPin, 
  IndianRupee, 
  Users, 
  Wifi, 
  Car, 
  Snowflake, 
  Home,
  Filter,
  Search,
  Heart,
  Phone,
  Mail,
  MessageCircle,
  Building,
  Bed
} from "lucide-react";

interface RoomListing {
  id: string;
  title: string;
  description: string;
  location: string;
  rentPerHead: string;
  totalRent: string;
  roomType: string;
  maxOccupancy: number;
  currentOccupancy: number;
  images: string[];
  facilities: string[];
  nearbyPlaces: string[];
  contactInfo: {
    phone?: string;
    email?: string;
    whatsapp?: string;
  };
  availableFrom: string;
  createdAt: string;
}

export default function RoomTour() {
  const [searchLocation, setSearchLocation] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [roomType, setRoomType] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: roomListings = [], isLoading } = useQuery<RoomListing[]>({
    queryKey: ["/api/room-listings", { location: searchLocation, maxRent, roomType }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchLocation) params.append("location", searchLocation);
      if (maxRent) params.append("maxRent", maxRent);
      if (roomType) params.append("roomType", roomType);
      
      const response = await fetch(`/api/room-listings?${params}`);
      if (!response.ok) throw new Error("Failed to fetch room listings");
      return response.json();
    },
  });

  const facilitiesIcons: { [key: string]: any } = {
    wifi: Wifi,
    ac: Snowflake,
    parking: Car,
    "air conditioning": Snowflake,
    "wi-fi": Wifi,
    kitchen: Home,
    security: Home,
    gym: Home,
    garden: Home,
    balcony: Home,
    laundry: Home,
    mess: Home,
  };

  const getFacilityIcon = (facility: string) => {
    const Icon = facilitiesIcons[facility.toLowerCase()] || Home;
    return <Icon className="w-4 h-4" />;
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mb-6">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Room Tour</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover perfect rooms with detailed photos, transparent pricing, and comprehensive facility information
          </p>
        </div>

        {/* Search and Filter Section */}
        <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by location (e.g., Delhi, Gurgaon)"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Rent per Head
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g., 15000"
                      value={maxRent}
                      onChange={(e) => setMaxRent(e.target.value)}
                      className="border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Type
                    </label>
                    <Select value={roomType} onValueChange={setRoomType}>
                      <SelectTrigger className="border-gray-300 focus:border-cyan-500 focus:ring-cyan-500">
                        <SelectValue placeholder="Select room type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Types</SelectItem>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="shared">Shared</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Room Listings Grid */}
        {roomListings.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No rooms found</h3>
              <p className="text-gray-600">
                Try adjusting your search criteria or check back later for new listings.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roomListings.map((room) => (
              <Card key={room.id} className="group border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-cyan-100 to-blue-200 relative overflow-hidden">
                  {room.images && room.images.length > 0 ? (
                    <img
                      src={room.images[0]}
                      alt={room.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Bed className="w-12 h-12 text-cyan-500" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 text-cyan-700">
                      {room.roomType}
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 bg-white/90 hover:bg-white text-cyan-600 hover:text-cyan-700"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                        {room.title}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-3">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{room.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center text-2xl font-bold text-gray-900">
                          <IndianRupee className="w-5 h-5" />
                          {formatPrice(room.rentPerHead)}
                        </div>
                        <div className="text-sm text-gray-500">per head/month</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-gray-600">
                          <Users className="w-4 h-4 mr-1" />
                          <span className="text-sm">
                            {room.currentOccupancy}/{room.maxOccupancy}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">occupancy</div>
                      </div>
                    </div>

                    {room.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {room.description}
                      </p>
                    )}

                    {room.facilities && room.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {room.facilities.slice(0, 3).map((facility, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-1 text-xs bg-cyan-50 text-cyan-700 px-2 py-1 rounded-full"
                          >
                            {getFacilityIcon(facility)}
                            <span>{facility}</span>
                          </div>
                        ))}
                        {room.facilities.length > 3 && (
                          <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            +{room.facilities.length - 3} more
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      {room.contactInfo?.phone && (
                        <Button size="sm" className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                          <Phone className="w-3 h-3 mr-1" />
                          Call
                        </Button>
                      )}
                      {room.contactInfo?.whatsapp && (
                        <Button size="sm" variant="outline" className="flex-1 border-green-200 text-green-700 hover:bg-green-50">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          WhatsApp
                        </Button>
                      )}
                      {room.contactInfo?.email && (
                        <Button size="sm" variant="outline" className="flex-1 border-cyan-200 text-cyan-700 hover:bg-cyan-50">
                          <Mail className="w-3 h-3 mr-1" />
                          Email
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Card className="border-0 shadow-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Have a room to list?</h3>
              <p className="text-cyan-100 mb-6 max-w-2xl mx-auto">
                Join our community and help others find their perfect roommate. List your room with detailed photos and information.
              </p>
              <Button className="bg-white text-cyan-600 hover:bg-cyan-50 font-semibold px-8 py-3">
                List Your Room
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}