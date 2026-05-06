import { z } from "zod";
import { klaviyoFetch } from "../klaviyo";
import type { ToolModule } from "./types";

const optInProcess = ["double_opt_in", "single_opt_in"] as const;

const listProfilesSort = z.enum([
  "joined_group_at",
  "-joined_group_at",
]);

export const lists: ToolModule = {
  register(server) {
    server.tool(
      "create_list",
      "Create a new list.",
      {
        name: z.string().describe("List name"),
        opt_in_process: z
          .enum(optInProcess)
          .optional()
          .describe("Subscription opt-in process for this list"),
        fields_list: z.string().optional().describe("Sparse fieldset for response"),
      },
      async ({ name, opt_in_process, fields_list }) => {
        const attributes: Record<string, unknown> = { name };
        if (opt_in_process !== undefined) attributes.opt_in_process = opt_in_process;
        const data = await klaviyoFetch("/api/lists", {
          method: "POST",
          query: { "fields[list]": fields_list },
          body: { data: { type: "list", attributes } },
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      },
    );

    server.tool(
      "update_list",
      "Update a list (rename and/or change opt-in process).",
      {
        list_id: z.string(),
        name: z.string().optional(),
        opt_in_process: z.enum(optInProcess).optional(),
        fields_list: z.string().optional(),
      },
      async ({ list_id, fields_list, ...rest }) => {
        const attributes: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(rest)) if (v !== undefined) attributes[k] = v;
        const data = await klaviyoFetch(`/api/lists/${list_id}`, {
          method: "PATCH",
          query: { "fields[list]": fields_list },
          body: { data: { type: "list", id: list_id, attributes } },
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      },
    );

    server.tool(
      "delete_list",
      "Delete a list by id.",
      { list_id: z.string() },
      async ({ list_id }) => {
        await klaviyoFetch(`/api/lists/${list_id}`, { method: "DELETE" });
        return { content: [{ type: "text", text: `Deleted list ${list_id}` }] };
      },
    );

    server.tool(
      "add_profiles_to_list",
      "Add existing profiles to a list (does not subscribe to marketing).",
      {
        list_id: z.string(),
        profile_ids: z.array(z.string()).min(1).max(1000).describe("Klaviyo profile IDs"),
      },
      async ({ list_id, profile_ids }) => {
        await klaviyoFetch(`/api/lists/${list_id}/relationships/profiles`, {
          method: "POST",
          body: { data: profile_ids.map((id) => ({ type: "profile", id })) },
        });
        return {
          content: [{ type: "text", text: `Added ${profile_ids.length} profile(s) to list ${list_id}` }],
        };
      },
    );

    server.tool(
      "remove_profiles_from_list",
      "Remove profiles from a list.",
      {
        list_id: z.string(),
        profile_ids: z.array(z.string()).min(1).max(1000),
      },
      async ({ list_id, profile_ids }) => {
        await klaviyoFetch(`/api/lists/${list_id}/relationships/profiles`, {
          method: "DELETE",
          body: { data: profile_ids.map((id) => ({ type: "profile", id })) },
        });
        return {
          content: [{ type: "text", text: `Removed ${profile_ids.length} profile(s) from list ${list_id}` }],
        };
      },
    );

    server.tool(
      "get_list_profiles",
      "Get profiles in a list with pagination. " +
        "Supported filter fields: email, phone_number, push_token, _kx, joined_group_at. " +
        "Sort is restricted to joined_group_at (asc/desc). page[size] default 20, max 100.",
      {
        list_id: z.string(),
        filter: z
          .string()
          .optional()
          .describe(
            'JSON:API filter using only allowed fields, e.g. equals(email,"a@b.com") or greater-than(joined_group_at,"2024-01-01T00:00:00Z")',
          ),
        sort: listProfilesSort.optional(),
        page_size: z.number().int().min(1).max(100).optional(),
        page_cursor: z.string().optional(),
        fields_profile: z.string().optional(),
        additional_fields_profile: z
          .string()
          .optional()
          .describe("Comma-separated, e.g. subscriptions,predictive_analytics"),
      },
      async ({
        list_id,
        filter,
        sort,
        page_size,
        page_cursor,
        fields_profile,
        additional_fields_profile,
      }) => {
        const data = await klaviyoFetch(`/api/lists/${list_id}/profiles`, {
          query: {
            filter,
            sort,
            "page[size]": page_size,
            "page[cursor]": page_cursor,
            "fields[profile]": fields_profile,
            "additional-fields[profile]": additional_fields_profile,
          },
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      },
    );
  },
};
