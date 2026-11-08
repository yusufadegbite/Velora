-- Database-level guarantee that a vehicle can never have two overlapping
-- active rental bookings, even under concurrent requests.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "RentalBooking"
  ADD CONSTRAINT "RentalBooking_no_overlap"
  EXCLUDE USING gist (
    "vehicleId" WITH =,
    tsrange("pickupAt", "returnAt", '[)') WITH &&
  )
  WHERE ("status" IN ('PENDING', 'CONFIRMED', 'ACTIVE'));

ALTER TABLE "RentalBooking"
  ADD CONSTRAINT "RentalBooking_valid_range" CHECK ("returnAt" > "pickupAt");

ALTER TABLE "RentalAvailability"
  ADD CONSTRAINT "RentalAvailability_valid_range" CHECK ("endsAt" > "startsAt");

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_rating_range" CHECK ("rating" BETWEEN 1 AND 5);

ALTER TABLE "Vehicle"
  ADD CONSTRAINT "Vehicle_price_positive" CHECK ("price" > 0);
