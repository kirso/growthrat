/**
 * Chat message persistence — stores conversation history for the chat widget.
 * Messages are grouped by threadId (stored in client localStorage).
 */

import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/** Get all messages for a thread, ordered by creation time. */
export const getThread = internalQuery({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    return await ctx.db
      .query("chatMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .collect();
  },
});

/** Save a message (user or assistant) to a thread. */
export const saveMessage = internalMutation({
  args: {
    threadId: v.string(),
    role: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatMessages", args);
  },
});
