# API Spec: Property Search (mobile parity)

## Objective

Provide one public endpoint for mobile (Expo) that returns property cards using the same search logic as web home in [app/page.tsx](app/page.tsx).

Current web parity filters:
- category (query param: filter)
- state (query param: country)
- min guests (query param: guest)
- min bedrooms (query param: rooms)
- min bathrooms (query param: bathrooms)

## Endpoint

- Method: GET
- Path: /api/properties/search
- Auth: optional

If user is authenticated, response can include favorite status per property.
If user is anonymous, favorites should be false.

## Query Params

- filter: string (optional)
- country: string (optional)
- guest: number as string (optional)
- rooms: number as string (optional)
- bathrooms: number as string (optional)
- page: number as string (optional, default: 1)
- limit: number as string (optional, default: 20, max: 50)
- startDate: ISO string (optional, extension)
- endDate: ISO string (optional, extension)

### Param rules

- filter="todos" means no category filter.
- guest/rooms/bathrooms must be positive integers.
- If startDate or endDate is sent, both are required.
- Date range must be valid: startDate < endDate.

## Base DB Constraints (same as web)

Always include these constraints in where:
- publishStatus = APPROVED
- addedCategory = true
- addedLocation = true
- addedDescription = true

And then optional filters:
- categoryName = filter (unless filter is empty or "todos")
- country = country
- guests >= guest
- bedrooms >= rooms
- bathrooms >= bathrooms

Note: in current schema these fields are String in [prisma/schema.prisma](prisma/schema.prisma), so server should cast carefully to numeric semantics.

## Availability Filter (recommended extension)

Only if startDate and endDate are present, exclude homes with overlapping reservations in status PENDING or CONFIRMED.

Overlap rule:
- existing.startDate < requestedEndDate
- existing.endDate > requestedStartDate

Equivalent condition in words:
Any reservation that intersects the requested interval blocks availability.

## Sort and Pagination

Default sort:
- createdAt desc (or newest first)

Pagination:
- skip = (page - 1) * limit
- take = limit

Response should include page metadata.

## Response Shape

200 OK

{
  "items": [
    {
      "id": "home_id",
      "title": "Casa en la playa",
      "photo": "user-.../file.jpg",
      "price": 45,
      "description": "...",
      "country": "CC",
      "municipality": "CHACAO",
      "categoryName": "house",
      "guests": "4",
      "bedrooms": "2",
      "bathrooms": "1",
      "latitude": 10.49,
      "longitude": -66.88,
      "ratingAvg": 4.8,
      "reviewCount": 12,
      "isFavorite": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 123,
    "totalPages": 7
  },
  "appliedFilters": {
    "filter": "house",
    "country": "CC",
    "guest": 2,
    "rooms": 1,
    "bathrooms": 1,
    "startDate": null,
    "endDate": null
  }
}

## Error Responses

- 400 Bad Request
  - invalid pagination
  - invalid guest/rooms/bathrooms
  - invalid date format
  - startDate >= endDate

- 500 Internal Server Error
  - unexpected server error

## Suggested Prisma Query (pseudo)

const where = {
  publishStatus: "APPROVED",
  addedCategory: true,
  addedLocation: true,
  addedDescription: true,
  categoryName: categoryFilter,
  country: countryFilter,
  guests: guestFilter,
  bedrooms: roomsFilter,
  bathrooms: bathroomsFilter,
  ...(hasDates
    ? {
        Reservation: {
          none: {
            status: { in: ["PENDING", "CONFIRMED"] },
            AND: [
              { startDate: { lt: requestedEndDate } },
              { endDate: { gt: requestedStartDate } }
            ]
          }
        }
      }
    : {})
};

## Mobile Mapping (Expo)

From mobile search UI to API params:
- state picker -> country
- guests counter -> guest
- bedrooms counter -> rooms
- bathrooms counter -> bathrooms
- category tabs -> filter
- calendar start/end -> startDate/endDate (optional extension)

## Compatibility Notes

- Web home currently does not apply date availability in global search (it applies dates in booking flow, not in home list query).
- This endpoint can keep parity mode (without dates) and enable date filtering only when params are provided.
