import { WebClient } from "@slack/web-api";

export function createSlackClient(token: string): WebClient {
  return new WebClient(token);
}

export async function postMessage(
  client: WebClient,
  channel: string,
  text: string,
): Promise<string | undefined> {
  const result = await client.chat.postMessage({ channel, text });
  return result.ts;
}

export interface ReportSection {
  heading: string;
  body: string;
}

export async function postReport(
  client: WebClient,
  channel: string,
  title: string,
  sections: ReportSection[],
): Promise<string | undefined> {
  const blocks: Record<string, unknown>[] = [
    {
      type: "header",
      text: { type: "plain_text", text: title, emoji: false },
    },
  ];

  for (const section of sections) {
    blocks.push(
      { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${section.heading}*\n${section.body}`,
        },
      },
    );
  }

  const result = await client.chat.postMessage({
    channel,
    text: title, // fallback for notifications
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    blocks: blocks as any,
  });
  return result.ts;
}
