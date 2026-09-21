-- Add Expo push token field to User for mobile push notifications
ALTER TABLE "User" ADD COLUMN "expoPushToken" TEXT;
