"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
  initialFollowersCount: number;
  isOwnProfile: boolean;
}

export function FollowButton({
  userId,
  initialIsFollowing,
  initialFollowersCount,
  isOwnProfile,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [isLoading, setIsLoading] = useState(false);

  if (isOwnProfile) {
    return <p className="text-sm text-muted">This is your profile.</p>;
  }

  async function handleFollow() {
    if (isLoading) return;

    const previous = isFollowing;
    setIsLoading(true);
    setIsFollowing(!previous);
    setFollowersCount((count) => count + (previous ? -1 : 1));

    try {
      const res = await fetch(`/api/users/${userId}/follow`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to update follow");
    } catch {
      setIsFollowing(previous);
      setFollowersCount((count) => count + (previous ? 1 : -1));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={handleFollow} disabled={isLoading}>
        {isFollowing ? "Unfollow" : "Follow"}
      </Button>
      <span className="text-sm text-muted">{followersCount} followers</span>
    </div>
  );
}