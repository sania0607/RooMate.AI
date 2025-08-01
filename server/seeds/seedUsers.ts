import { storage } from "../storage.ts";
import { db } from "../db.ts";
import { users, userProfiles } from "../../shared/schema.ts";

async function seedUsers() {
  // Example users
  const testUsers = [
    {
      id: "user1",
      username: "alice",
      email: "alice@example.com",
      name: "Alice",
      password: "password1",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "user2",
      username: "bob",
      email: "bob@example.com",
      name: "Bob",
      password: "password2",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "user3",
      username: "carol",
      email: "carol@example.com",
      name: "Carol",
      password: "password3",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Example profiles
  // Allowed values for union types
  const HIGH = "high" as const;
  const MEDIUM = "medium" as const;
  const LOW = "low" as const;
  const SINGLE = "single" as const;
  const TWIN = "twin" as const;
  const NO_PREF = "no_preference" as const;
  const QUIET = "quiet" as const;
  const LIVELY = "lively" as const;
  const OCCASIONALLY = "occasionally" as const;
  const FREQUENTLY = "frequently" as const;
  const RARELY = "rarely" as const;
  const NEVER = "never" as const;

  const testProfiles = [
    {
      userId: "user1",
      name: "Alice",
      age: 25,
      location: "New York",
      occupation: "Engineer",
      education: "MIT",
      budget: "1200-1800",
      bio: "Love cats and coffee.",
      gender: "female",
      lifestyle: {
        cleanliness: 4,
        cleanlinessImportance: HIGH,
        socialLevel: 3,
        socialLevelImportance: MEDIUM,
        sleepSchedule: "22:00-07:00",
        sleepTime: "22:00",
        wakeTime: "07:00",
        sleepImportance: MEDIUM,
        workSchedule: "9-5",
        pets: true,
        petType: "cat",
        smoking: false,
        drinking: true,
        drinkingFrequency: OCCASIONALLY,
        roomType: SINGLE,
        floorType: QUIET,
        cooking: true,
        musicLevel: 2,
        musicImportance: MEDIUM,
        lifestyleTags: ["yoga", "reading"],
        guestPolicy: OCCASIONALLY
      },
      preferences: {
        ageRange: [22, 30] as [number, number],
        locationRadius: 10,
        budgetRange: [1200, 1800] as [number, number],
        dealBreakers: ["smoking"],
        mustHaves: ["pets allowed"]
      },
      tags: ["yoga", "reading", "music"],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      userId: "user2",
      name: "Bob",
      age: 27,
      location: "New York",
      occupation: "Designer",
      education: "NYU",
      budget: "1000-1500",
      bio: "Dog lover and foodie.",
      gender: "male",
      lifestyle: {
        cleanliness: 3,
        cleanlinessImportance: MEDIUM,
        socialLevel: 4,
        socialLevelImportance: HIGH,
        sleepSchedule: "01:00-09:00",
        sleepTime: "01:00",
        wakeTime: "09:00",
        sleepImportance: LOW,
        workSchedule: "Flexible",
        pets: false,
        smoking: false,
        drinking: true,
        drinkingFrequency: FREQUENTLY,
        roomType: TWIN,
        floorType: LIVELY,
        cooking: false,
        musicLevel: 4,
        musicImportance: HIGH,
        lifestyleTags: ["sports", "cooking"],
        guestPolicy: FREQUENTLY
      },
      preferences: {
        ageRange: [24, 32] as [number, number],
        locationRadius: 15,
        budgetRange: [1000, 1500] as [number, number],
        dealBreakers: ["pets"],
        mustHaves: ["balcony"]
      },
      tags: ["sports", "cooking", "travel"],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      userId: "user3",
      name: "Carol",
      age: 24,
      location: "Boston",
      occupation: "Student",
      education: "Harvard",
      budget: "900-1300",
      bio: "Runner and tech enthusiast.",
      gender: "female",
      lifestyle: {
        cleanliness: 5,
        cleanlinessImportance: HIGH,
        socialLevel: 2,
        socialLevelImportance: LOW,
        sleepSchedule: "21:30-06:30",
        sleepTime: "21:30",
        wakeTime: "06:30",
        sleepImportance: HIGH,
        workSchedule: "Night Shift",
        pets: false,
        smoking: false,
        drinking: false,
        roomType: SINGLE,
        floorType: QUIET,
        cooking: true,
        musicLevel: 1,
        musicImportance: LOW,
        lifestyleTags: ["running", "tech"],
        guestPolicy: RARELY
      },
      preferences: {
        ageRange: [21, 28] as [number, number],
        locationRadius: 20,
        budgetRange: [900, 1300] as [number, number],
        dealBreakers: ["parties"],
        mustHaves: ["quiet neighborhood"]
      },
      tags: ["running", "tech", "reading"],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Insert users
  for (const user of testUsers) {
    await db.insert(users).values(user).onConflictDoNothing();
  }

  // Insert profiles
  for (const profile of testProfiles) {
    await db.insert(userProfiles).values(profile).onConflictDoNothing();
  }

  console.log("Seeded test users and profiles!");
}

seedUsers().then(() => process.exit(0));
