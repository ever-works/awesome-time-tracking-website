"use client";

import { useLoginModal } from "./use-login-modal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrentUser } from "./use-current-user";

interface ItemVoteResponse {
  count: number;
  userVote: "up" | "down" | null;
}
let api='/api/items'

export function useItemVote(itemId: string) {
  const { user } = useCurrentUser();
  const loginModal = useLoginModal();
  const queryClient = useQueryClient();

  const { data: voteData, isLoading } = useQuery<ItemVoteResponse>({
    queryKey: ["item-votes", itemId],
    queryFn: async () => {
      const response = await fetch(`${api}/${itemId}/votes`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch item votes");
      }
      return response.json();
    },
    enabled: !!itemId,
  });

  const { mutate: vote, isPending: isVoting } = useMutation({
    mutationFn: async (type: "up" | "down") => {
      if (!user) {
        loginModal.onOpen("Please sign in to vote on this item");
        return;
      }

      const response = await fetch(`${api}/${itemId}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to vote on item");
      }

      return response.json();
    },
    onMutate: async (type) => {
      if (!user) {
        return;
      }

      await queryClient.cancelQueries({ queryKey: ["item-votes", itemId] });
      const previousVotes = queryClient.getQueryData<ItemVoteResponse>(["item-votes", itemId]);

      queryClient.setQueryData<ItemVoteResponse>(["item-votes", itemId], (old) => {
        if (!old) return { count: 1, userVote: type };
        
        const countDiff = old.userVote === type ? -1 : old.userVote === null ? 1 : 2;
        return {
          count: old.count + (type === "up" ? countDiff : -countDiff),
          userVote: old.userVote === type ? null : type,
        };
      });

      return { previousVotes };
    },
    onError: (error, _, context) => {
      if (context?.previousVotes) {
        queryClient.setQueryData(["item-votes", itemId], context.previousVotes);
      }
      toast.error(error.message || "An error occurred while voting");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["item-votes", itemId] });
    },
  });

  const { mutate: unvote, isPending: isUnvoting } = useMutation({
    mutationFn: async () => {
      if (!user) {
        loginModal.onOpen("Please sign in to vote on this item");
        return;
      }

      const response = await fetch(`${api}/${itemId}/votes`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to remove vote");
      }

      return response.json();
    },
    onMutate: async () => {
      if (!user) {
        return;
      }

      await queryClient.cancelQueries({ queryKey: ["item-votes", itemId] });
      const previousVotes = queryClient.getQueryData<ItemVoteResponse>(["item-votes", itemId]);

      queryClient.setQueryData<ItemVoteResponse>(["item-votes", itemId], (old) => {
        if (!old) return { count: 0, userVote: null };
        return {
          count: old.count + (old.userVote === "up" ? -1 : old.userVote === "down" ? 1 : 0),
          userVote: null,
        };
      });

      return { previousVotes };
    },
    onError: (error, _, context) => {
      if (context?.previousVotes) {
        queryClient.setQueryData(["item-votes", itemId], context.previousVotes);
      }
      toast.error(error.message || "An error occurred while removing your vote");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["item-votes", itemId] });
    },
  });

  const handleVote = (type: "up" | "down") => {
    if (isVoting || isUnvoting) return;
    
    if (!user) {
      loginModal.onOpen("Please sign in to vote on this item");
      return;
    }
    
    if (voteData?.userVote === type) {
      unvote();
    } else {
      vote(type);
    }
  };

  return {
    voteCount: voteData?.count || 0,
    userVote: voteData?.userVote || null,
    isLoading: isLoading || isVoting || isUnvoting,
    handleVote,
  };
}
