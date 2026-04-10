import type { ToolDefinition } from "../types.js";
import { videoTools } from "./videos.js";
import { commentTools } from "./comments.js";
import { channelTools } from "./channels.js";
import { playlistTools } from "./playlists.js";
import { analyticsTools } from "./analytics.js";
import { gateTools } from "./gates.js";
import { sequenceTools } from "./sequences.js";
import { usageTools } from "./usage.js";
import { staffTools } from "./staff.js";

export const allTools: ToolDefinition[] = [
  ...videoTools,
  ...commentTools,
  ...channelTools,
  ...playlistTools,
  ...analyticsTools,
  ...gateTools,
  ...sequenceTools,
  ...usageTools,
  ...staffTools,
];
