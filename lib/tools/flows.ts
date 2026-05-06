import { z } from "zod";
import { klaviyoFetch } from "../klaviyo";
import type { ToolModule } from "./types";

const flowStatuses = ["draft", "manual", "live"] as const;

const flowActionInclude = z.enum(["flow", "flow-messages"]);
const flowMessageInclude = z.enum(["flow-action", "template"]);

const flowActionSort = z.enum([
  "action_type",
  "-action_type",
  "created",
  "-created",
  "id",
  "-id",
  "status",
  "-status",
  "updated",
  "-updated",
]);

export const flows: ToolModule = {
  register(server) {
    server.tool(
      "create_flow",
      "Create a new flow from a flow definition. Pass the full Klaviyo flow definition object — " +
        "triggers (list/segment/metric/profile-property-date/price-drop/low-inventory), profile_filter, " +
        "actions (send_email, send_sms, time_delay, conditional_branch, etc.), entry_action_id, and reentry_criteria. " +
        "Newly created sub-objects must include a `temporary_id` to be referenced from elsewhere in the definition.",
      {
        name: z.string().describe("Flow name"),
        definition: z
          .record(z.any())
          .describe("Klaviyo flow definition object (triggers, profile_filter, actions, entry_action_id, reentry_criteria)"),
        fields_flow: z.string().optional().describe("Sparse fieldset for response"),
        additional_fields_flow: z
          .enum(["definition"])
          .optional()
          .describe("Set to 'definition' to include the full definition in the response"),
      },
      async ({ name, definition, fields_flow, additional_fields_flow }) => {
        const data = await klaviyoFetch("/api/flows", {
          method: "POST",
          query: {
            "fields[flow]": fields_flow,
            "additional-fields[flow]": additional_fields_flow,
          },
          body: { data: { type: "flow", attributes: { name, definition } } },
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      },
    );

    server.tool(
      "update_flow_status",
      "Update a flow's status (draft / manual / live).",
      {
        flow_id: z.string(),
        status: z.enum(flowStatuses),
        fields_flow: z.string().optional(),
        additional_fields_flow: z.enum(["definition"]).optional(),
      },
      async ({ flow_id, status, fields_flow, additional_fields_flow }) => {
        const data = await klaviyoFetch(`/api/flows/${flow_id}`, {
          method: "PATCH",
          query: {
            "fields[flow]": fields_flow,
            "additional-fields[flow]": additional_fields_flow,
          },
          body: { data: { type: "flow", id: flow_id, attributes: { status } } },
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      },
    );

    server.tool(
      "delete_flow",
      "Delete a flow by id.",
      { flow_id: z.string() },
      async ({ flow_id }) => {
        await klaviyoFetch(`/api/flows/${flow_id}`, { method: "DELETE" });
        return { content: [{ type: "text", text: `Deleted flow ${flow_id}` }] };
      },
    );

    server.tool(
      "update_flow_action",
      "Update a flow action. Pass `definition` containing the action-type-specific data block " +
        "(SendEmailAction, ConditionalBranchAction, TimeDelayAction, etc.). Refer to the Klaviyo " +
        "update_flow_action reference for the editable fields per action type.",
      {
        flow_action_id: z.string(),
        definition: z
          .record(z.any())
          .optional()
          .describe(
            "Action-type-specific definition object, e.g. { type: 'send_email', data: { status: 'live', message: {...} } }",
          ),
        attributes: z
          .record(z.any())
          .optional()
          .describe(
            "Escape hatch: pass a raw attributes object. If both `definition` and `attributes` are provided, `definition` is merged into `attributes`.",
          ),
        fields_flow_action: z.string().optional().describe("Sparse fieldset for response"),
      },
      async ({ flow_action_id, definition, attributes, fields_flow_action }) => {
        const merged: Record<string, unknown> = { ...(attributes ?? {}) };
        if (definition !== undefined) merged.definition = definition;
        const data = await klaviyoFetch(`/api/flow-actions/${flow_action_id}`, {
          method: "PATCH",
          query: { "fields[flow-action]": fields_flow_action },
          body: { data: { type: "flow-action", id: flow_action_id, attributes: merged } },
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      },
    );

    server.tool(
      "get_flow_action",
      "Get a single flow action by id, optionally with included related resources (flow and/or flow-messages).",
      {
        flow_action_id: z.string(),
        fields_flow_action: z.string().optional(),
        fields_flow: z.string().optional().describe("Sparse fieldset for included flow"),
        fields_flow_message: z
          .string()
          .optional()
          .describe("Sparse fieldset for included flow-messages"),
        include: z
          .array(flowActionInclude)
          .optional()
          .describe("Related resources to side-load: flow, flow-messages"),
      },
      async ({
        flow_action_id,
        fields_flow_action,
        fields_flow,
        fields_flow_message,
        include,
      }) => {
        const data = await klaviyoFetch(`/api/flow-actions/${flow_action_id}`, {
          query: {
            "fields[flow-action]": fields_flow_action,
            "fields[flow]": fields_flow,
            "fields[flow-message]": fields_flow_message,
            include: include?.join(","),
          },
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      },
    );

    server.tool(
      "get_flow_message",
      "Get a single flow message by id, optionally with the parent flow-action and/or its template included.",
      {
        flow_message_id: z.string(),
        fields_flow_message: z.string().optional(),
        fields_flow_action: z.string().optional(),
        fields_template: z.string().optional(),
        include: z
          .array(flowMessageInclude)
          .optional()
          .describe("Related resources to side-load: flow-action, template"),
      },
      async ({
        flow_message_id,
        fields_flow_message,
        fields_flow_action,
        fields_template,
        include,
      }) => {
        const data = await klaviyoFetch(`/api/flow-messages/${flow_message_id}`, {
          query: {
            "fields[flow-message]": fields_flow_message,
            "fields[flow-action]": fields_flow_action,
            "fields[template]": fields_template,
            include: include?.join(","),
          },
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      },
    );

    server.tool(
      "get_flow_actions",
      "Get all flow actions for a flow (full objects). " +
        "filter fields: id, action_type, status, created, updated. " +
        "page[size] default 50, max 50.",
      {
        flow_id: z.string(),
        filter: z.string().optional().describe("JSON:API filter using id/action_type/status/created/updated"),
        sort: flowActionSort.optional(),
        page_size: z.number().int().min(1).max(50).optional(),
        page_cursor: z.string().optional(),
        fields_flow_action: z.string().optional(),
      },
      async ({ flow_id, filter, sort, page_size, page_cursor, fields_flow_action }) => {
        const data = await klaviyoFetch(`/api/flows/${flow_id}/flow-actions`, {
          query: {
            filter,
            sort,
            "page[size]": page_size,
            "page[cursor]": page_cursor,
            "fields[flow-action]": fields_flow_action,
          },
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      },
    );

    server.tool(
      "get_flow_action_ids",
      "Get just the flow-action IDs (relationships endpoint) for a flow. Lighter than get_flow_actions. " +
        "filter fields: id, action_type, status, created, updated. page[size] default 50, max 50.",
      {
        flow_id: z.string(),
        filter: z.string().optional(),
        sort: flowActionSort.optional(),
        page_size: z.number().int().min(1).max(50).optional(),
        page_cursor: z.string().optional(),
      },
      async ({ flow_id, filter, sort, page_size, page_cursor }) => {
        const data = await klaviyoFetch(`/api/flows/${flow_id}/relationships/flow-actions`, {
          query: {
            filter,
            sort,
            "page[size]": page_size,
            "page[cursor]": page_cursor,
          },
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      },
    );
  },
};
