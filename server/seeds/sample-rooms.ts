import { getDb } from "../db";
import { roomListings } from "../../shared/schema";

import dotenv from "dotenv";
dotenv.config();

// Auto-run when script is executed directly  
const isMainModule = import.meta.url.includes(process.argv[1]);
if (isMainModule) {
  seedSampleRooms().then(() => {
    console.log("Seeding completed");
    process.exit(0);
  }).catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
}

export async function seedSampleRooms() {
  const db = getDb();
  
  const sampleRooms = [
    {
      id: "room-1",
      title: "Modern 2BHK in Gurgaon",
      description: "Spacious and well-furnished room in a modern apartment with all amenities. Perfect for working professionals.",
      location: "Sector 49, Gurgaon",
      rentPerHead: "12000",
      totalRent: "24000",
      roomType: "shared",
      maxOccupancy: 2,
      currentOccupancy: 1,
      images: ["/placeholder-room-1.jpg"],
      facilities: ["WiFi", "AC", "Parking", "Security", "Gym"],
      nearbyPlaces: ["Metro Station - 500m", "Shopping Mall - 1km", "Hospital - 2km"],
      contactInfo: {
        phone: "+91-9876543210",
        whatsapp: "+91-9876543210",
        email: "contact@roommate.com"
      },
      availableFrom: new Date("2024-09-01"),
      postedBy: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "room-2",
      title: "Cozy Studio Apartment in Delhi",
      description: "Perfect single occupancy studio with kitchen facilities and 24/7 security.",
      location: "Lajpat Nagar, Delhi",
      rentPerHead: "18000",
      totalRent: "18000",
      roomType: "single",
      maxOccupancy: 1,
      currentOccupancy: 0,
      images: ["/placeholder-room-2.jpg"],
      facilities: ["WiFi", "Kitchen", "Security", "Power Backup"],
      nearbyPlaces: ["Metro Station - 300m", "Market - 100m", "Park - 200m"],
      contactInfo: {
        phone: "+91-9876543211",
        email: "studio@roommate.com"
      },
      availableFrom: new Date("2024-08-15"),
      postedBy: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "room-3",
      title: "Premium 3BHK with Balcony",
      description: "Luxury apartment with balcony view, fully furnished with modern amenities for comfortable living.",
      location: "Bandra West, Mumbai",
      rentPerHead: "25000",
      totalRent: "75000",
      roomType: "private",
      maxOccupancy: 3,
      currentOccupancy: 2,
      images: ["/placeholder-room-3.jpg"],
      facilities: ["WiFi", "AC", "Balcony", "Parking", "Swimming Pool", "Gym"],
      nearbyPlaces: ["Railway Station - 800m", "Beach - 1.5km", "Airport - 10km"],
      contactInfo: {
        phone: "+91-9876543212",
        whatsapp: "+91-9876543212",
        email: "premium@roommate.com"
      },
      availableFrom: new Date("2024-09-15"),
      postedBy: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "room-4",
      title: "Affordable PG in Bangalore",
      description: "Budget-friendly accommodation with basic amenities in a safe neighborhood.",
      location: "Koramangala, Bangalore",
      rentPerHead: "8000",
      totalRent: "16000",
      roomType: "shared",
      maxOccupancy: 2,
      currentOccupancy: 1,
      images: ["/placeholder-room-4.jpg"],
      facilities: ["WiFi", "Laundry", "Security", "Mess"],
      nearbyPlaces: ["Tech Park - 2km", "Bus Stop - 200m", "Cafe - 500m"],
      contactInfo: {
        phone: "+91-9876543213",
        whatsapp: "+91-9876543213"
      },
      availableFrom: new Date("2024-08-20"),
      postedBy: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "room-5",
      title: "Spacious Room in Pune",
      description: "Large room with attached bathroom in a well-maintained building with garden area.",
      location: "Viman Nagar, Pune",
      rentPerHead: "15000",
      totalRent: "30000",
      roomType: "shared",
      maxOccupancy: 2,
      currentOccupancy: 0,
      images: ["/placeholder-room-5.jpg"],
      facilities: ["WiFi", "AC", "Garden", "Parking", "Security"],
      nearbyPlaces: ["Airport - 5km", "Mall - 1km", "Hospital - 800m"],
      contactInfo: {
        phone: "+91-9876543214",
        email: "pune@roommate.com"
      },
      availableFrom: new Date("2024-09-10"),
      postedBy: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  try {
    // Check if rooms already exist
    const existingRooms = await db.select().from(roomListings);
    if (existingRooms.length === 0) {
      console.log("Seeding sample room listings...");
      // Serialize arrays/objects to JSON strings for DB compatibility
      const serializableRooms = sampleRooms.map(room => ({
        ...room,
        images: JSON.stringify(room.images),
        facilities: JSON.stringify(room.facilities),
        nearbyPlaces: JSON.stringify(room.nearbyPlaces),
        contactInfo: JSON.stringify(room.contactInfo)
      }));
      await db.insert(roomListings).values(serializableRooms);
      console.log(`Successfully seeded ${sampleRooms.length} sample room listings.`);
    } else {
      console.log("Room listings already exist, skipping seed.");
    }
  } catch (error) {
    console.error("Error seeding sample rooms:", error);
  }
}