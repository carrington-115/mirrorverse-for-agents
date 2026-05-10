"use server";

import { env } from "@mirrorverse/env/app";

const fetchUrl = env.NEXT_PUBLIC_API_URL;

export const handleRegisterUser = async (email: string, userId: string) => {
  try {
    const response = await fetch(`${fetchUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, userId }),
    });

    if (!response.ok) {
      throw new Error("Failed to register user");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};
