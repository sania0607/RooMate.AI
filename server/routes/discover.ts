import { Request, Response } from "express";
import { db } from "../db";
import { userProfiles, users } from "../../shared/schema";
import { eq, and, ne, isNotNull } from "drizzle-orm";

export async function getDiscoverUsers(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get all users with completed profiles (have profile pictures)
    const candidateUsers = await db
      .select({
        id: users.id,
        name: users.name,
        profileImageUrl: users.profileImageUrl,
        profile: userProfiles
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(
        and(
          ne(users.id, userId), // Exclude current user
          isNotNull(userProfiles.profileImageUrl) // Only users with profile pictures
        )
      )
      .limit(50);

    // Add sample compatibility scores
    const candidatesWithScores = candidateUsers.map(candidate => ({
      ...candidate,
      compatibilityScore: Math.floor(Math.random() * 30) + 70 // Random score between 70-100
    }));

    res.json(candidatesWithScores);
  } catch (error) {
    console.error("Error fetching discover users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
}