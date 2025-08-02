// Room listing operations
  async getAllRoomListings(limit: number = 50): Promise<RoomListing[]> {
    const listings = await getDb()
      .select()
      .from(roomListings)
      .where(eq(roomListings.isActive, true))
      .orderBy(desc(roomListings.createdAt))
      .limit(limit);
    
    // Parse arrays and objects that might be stored as JSON strings
    return listings.map(listing => ({
      ...listing,
      images: Array.isArray(listing.images) ? listing.images : 
              (typeof listing.images === 'string' ? JSON.parse(listing.images) : []),
      facilities: Array.isArray(listing.facilities) ? listing.facilities : 
                  (typeof listing.facilities === 'string' ? JSON.parse(listing.facilities) : []),
      nearbyPlaces: Array.isArray(listing.nearbyPlaces) ? listing.nearbyPlaces : 
                    (typeof listing.nearbyPlaces === 'string' ? JSON.parse(listing.nearbyPlaces) : []),
      contactInfo: typeof listing.contactInfo === 'object' ? listing.contactInfo : 
                   (typeof listing.contactInfo === 'string' ? JSON.parse(listing.contactInfo) : {})
    }));
  }

  async getRoomListing(id: string): Promise<RoomListing | undefined> {
    const [listing] = await getDb()
      .select()
      .from(roomListings)
      .where(and(eq(roomListings.id, id), eq(roomListings.isActive, true)));
    
    if (!listing) return undefined;
    
    // Parse arrays and objects that might be stored as JSON strings
    return {
      ...listing,
      images: Array.isArray(listing.images) ? listing.images : 
              (typeof listing.images === 'string' ? JSON.parse(listing.images) : []),
      facilities: Array.isArray(listing.facilities) ? listing.facilities : 
                  (typeof listing.facilities === 'string' ? JSON.parse(listing.facilities) : []),
      nearbyPlaces: Array.isArray(listing.nearbyPlaces) ? listing.nearbyPlaces : 
                    (typeof listing.nearbyPlaces === 'string' ? JSON.parse(listing.nearbyPlaces) : []),
      contactInfo: typeof listing.contactInfo === 'object' ? listing.contactInfo : 
                   (typeof listing.contactInfo === 'string' ? JSON.parse(listing.contactInfo) : {})
    };
  }

  async createRoomListing(listingData: InsertRoomListing): Promise<RoomListing> {
    const [listing] = await getDb()
      .insert(roomListings)
      .values(listingData)
      .returning();
    
    // Parse arrays and objects that might be stored as JSON strings
    return {
      ...listing,
      images: Array.isArray(listing.images) ? listing.images : 
              (typeof listing.images === 'string' ? JSON.parse(listing.images) : []),
      facilities: Array.isArray(listing.facilities) ? listing.facilities : 
                  (typeof listing.facilities === 'string' ? JSON.parse(listing.facilities) : []),
      nearbyPlaces: Array.isArray(listing.nearbyPlaces) ? listing.nearbyPlaces : 
                    (typeof listing.nearbyPlaces === 'string' ? JSON.parse(listing.nearbyPlaces) : []),
      contactInfo: typeof listing.contactInfo === 'object' ? listing.contactInfo : 
                   (typeof listing.contactInfo === 'string' ? JSON.parse(listing.contactInfo) : {})
    };
  }

  async updateRoomListing(id: string, updates: Partial<InsertRoomListing>): Promise<RoomListing> {
    const updateData: any = { ...updates, updatedAt: new Date() };
    const [listing] = await getDb()
      .update(roomListings)
      .set(updateData)
      .where(eq(roomListings.id, id))
      .returning();
    
    // Parse arrays and objects that might be stored as JSON strings
    return {
      ...listing,
      images: Array.isArray(listing.images) ? listing.images : 
              (typeof listing.images === 'string' ? JSON.parse(listing.images) : []),
      facilities: Array.isArray(listing.facilities) ? listing.facilities : 
                  (typeof listing.facilities === 'string' ? JSON.parse(listing.facilities) : []),
      nearbyPlaces: Array.isArray(listing.nearbyPlaces) ? listing.nearbyPlaces : 
                    (typeof listing.nearbyPlaces === 'string' ? JSON.parse(listing.nearbyPlaces) : []),
      contactInfo: typeof listing.contactInfo === 'object' ? listing.contactInfo : 
                   (typeof listing.contactInfo === 'string' ? JSON.parse(listing.contactInfo) : {})
    };
  }

  async deleteRoomListing(id: string): Promise<void> {
    await getDb()
      .update(roomListings)
      .set({ isActive: false })
      .where(eq(roomListings.id, id));
  }

  async searchRoomListings(filters: { location?: string; maxRent?: number; roomType?: string }): Promise<RoomListing[]> {
    const conditions = [eq(roomListings.isActive, true)];
    
    if (filters.location) {
      conditions.push(sql`${roomListings.location} ILIKE ${'%' + filters.location + '%'}`);
    }
    
    if (filters.maxRent) {
      conditions.push(sql`CAST(${roomListings.rentPerHead} AS NUMERIC) <= ${filters.maxRent}`);
    }
    
    if (filters.roomType) {
      conditions.push(eq(roomListings.roomType, filters.roomType));
    }
    
    const listings = await getDb()
      .select()
      .from(roomListings)
      .where(and(...conditions))
      .orderBy(desc(roomListings.createdAt));
    
    // Parse arrays and objects that might be stored as JSON strings
    return listings.map(listing => ({
      ...listing,
      images: Array.isArray(listing.images) ? listing.images : 
              (typeof listing.images === 'string' ? JSON.parse(listing.images) : []),
      facilities: Array.isArray(listing.facilities) ? listing.facilities : 
                  (typeof listing.facilities === 'string' ? JSON.parse(listing.facilities) : []),
      nearbyPlaces: Array.isArray(listing.nearbyPlaces) ? listing.nearbyPlaces : 
                    (typeof listing.nearbyPlaces === 'string' ? JSON.parse(listing.nearbyPlaces) : []),
      contactInfo: typeof listing.contactInfo === 'object' ? listing.contactInfo : 
                   (typeof listing.contactInfo === 'string' ? JSON.parse(listing.contactInfo) : {})
    }));
  }