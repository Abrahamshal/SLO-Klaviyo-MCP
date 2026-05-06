import { z } from "zod";
import { klaviyoFetch } from "../klaviyo";
import type { ToolModule } from "./types";

export const segments: ToolModule = {
  register(server) {
    server.tool(
      "create_segment",
      "Create a new segment with a definition. The definition is a Klaviyo segment-definition object describing the conditions.",
      {
        name: z.string().describe("Segment name"),
        definition: z.record(z.any()).describe(
          "Segment definition object per Klaviyo schema, e.g. " +
            "{ condition_groups: [{ conditions: [{ type: 'profile-property', ... }] }] }",
        ),
        is_starred: z.boolean().optional(),
        fields_segment: z.string().optional().describe("Sparse fieldset for response"),
      },
      async ({ name, definition, is_starred, fields_segment }) => {
        const attributes: Record<string, unknown> = { name, definition };
        if (is_starred !== undefined) attributes.is_starred = is_starred;
        const data = await klaviyoFetch("/api/segments", {
          method: "POST",
          query: { "fields[segment]": fields_segment },
          body: { data: { type: "segment", attributes } },
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      },
    );

    server.tool(
      "update_segment",
      "Update an existing segment. Note: when setting `is_active=false` to deactivate a segment, " +
        "Klaviyo requires that to be the ONLY attribute in the request — do not pass name/definition/is_starred at the same time.",
      {
        segment_id: z.string(),
        name: z.string().optional(),
        definition: z.record(z.any()).optional(),
        is_starred: z.boolean().optional(),
        is_active: z
          .boolean()
          .nullable()
          .optional()
          .describe("Set to false to deactivate. Must be the only attribute when used."),
        fields_segment: z.string().optional().describe("Sparse fieldset for response"),
      },
      async ({ segment_id, fields_segment, ...rest }) => {
        const attributes: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(rest)) if (v !== undefined) attributes[k] = v;
        const data = await klaviyoFetch(`/api/segments/${segment_id}`, {
          method: "PATCH",
          query: { "fields[segment]": fields_segment },
          body: { data: { type: "segment", id: segment_id, attributes } },
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      },
    );

    server.tool(
      "delete_segment",
      "Delete a segment by id.",
      { segment_id: z.string() },
      async ({ segment_id }) => {
        await klaviyoFetch(`/api/segments/${segment_id}`, { method: "DELETE" });
        return { content: [{ type: "text", text: `Deleted segment ${segment_id}` }] };
      },
    );
  },
};
