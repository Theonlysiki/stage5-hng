import express from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        fullName: string;
        userID: string;
        role: string;
        // Add any other user-related fields here
      };
    }
  }
}