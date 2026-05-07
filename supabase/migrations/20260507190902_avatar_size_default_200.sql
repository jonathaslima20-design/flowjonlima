/*
  # Update avatar_size default to 200

  Changes:
  - `profiles.avatar_size`: updates column default from 90 to 200
  - Updates existing profiles that still have the old default value (90) to 200
    so they benefit from the larger avatar out of the box
*/

ALTER TABLE profiles ALTER COLUMN avatar_size SET DEFAULT 200;

UPDATE profiles SET avatar_size = 200 WHERE avatar_size IS NULL OR avatar_size = 90;
