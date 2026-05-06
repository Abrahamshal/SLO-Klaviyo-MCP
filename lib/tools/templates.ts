import { z } from "zod";
import { klaviyoFetch } from "../klaviyo";
import type { ToolModule } from "./types";

const editorTypes = ["CODE", "DRAG_DROP", "USER_DRAGGABLE", "VISUAL"] as const;

export const templates: ToolModule = {
  register(server) {
    server.tool(
      "get_templates",
      "List email templates. Supports JSON:API filter, sort, paging, sparse fieldsets, and additional-fields[template]=definition.",
      {
        filter: z.string().optional().describe('JSON:API filter, e.g. equals(name,"foo")'),
        sort: z.string().optional().describe("Sort field, e.g. -created"),
        page_size: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .describe("1-10 (Klaviyo enforces a max of 10 on this endpoint)"),
        page_cursor: z.string().optional(),
        fields_template: z.string().optional().describe("Sparse fieldset, comma-separated"),
        additional_fields_template: z
          .enum(["definition"])
          .optional()
          .describe("Set to 'definition' to include the template definition in the response"),
      },
      async ({
        filter,
        sort,
        page_size,
        page_cursor,
        fields_template,
        additional_fields_template,
      }) => {
        const data = await klaviyoFetch("/api/templates", {
          query: {
            filter,
            sort,
            "page[size]": page_size,
            "page[cursor]": page_cursor,
            "fields[template]": fields_template,
            "additional-fields[template]": additional_fields_template,
          },
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      },
    );

    server.tool(
      "create_template",
      "Create a new email template (HTML or drag-and-drop).",
      {
        name: z.string().describe("Template name"),
        editor_type: z.enum(editorTypes).describe("Editor type used to author the template"),
        html: z.string().optional().describe("HTML body. Required for CODE editor type."),
        text: z.string().optional().describe("Plain text version"),
        amp: z.string().optional().describe("AMP HTML body"),
        fields_template: z.string().optional().describe("Sparse fieldset for response"),
        additional_fields_template: z.enum(["definition"]).optional(),
      },
      async ({
        name,
        editor_type,
        html,
        text,
        amp,
        fields_template,
        additional_fields_template,
      }) => {
        const attributes: Record<string, unknown> = { name, editor_type };
        if (html !== undefined) attributes.html = html;
        if (text !== undefined) attributes.text = text;
        if (amp !== undefined) attributes.amp = amp;
        const data = await klaviyoFetch("/api/templates", {
          method: "POST",
          query: {
            "fields[template]": fields_template,
            "additional-fields[template]": additional_fields_template,
          },
          body: { data: { type: "template", attributes } },
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      },
    );

    server.tool(
      "update_template",
      "Update an existing email template. For drag-and-drop templates you may patch `definition`.",
      {
        template_id: z.string().describe("Template ID"),
        name: z.string().optional(),
        html: z.string().optional(),
        text: z.string().optional(),
        amp: z.string().optional(),
        definition: z
          .record(z.any())
          .nullable()
          .optional()
          .describe("Template definition object (for drag-and-drop templates)"),
        fields_template: z.string().optional(),
        additional_fields_template: z.enum(["definition"]).optional(),
      },
      async ({ template_id, fields_template, additional_fields_template, ...rest }) => {
        const attributes: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(rest)) if (v !== undefined) attributes[k] = v;
        const data = await klaviyoFetch(`/api/templates/${template_id}`, {
          method: "PATCH",
          query: {
            "fields[template]": fields_template,
            "additional-fields[template]": additional_fields_template,
          },
          body: { data: { type: "template", id: template_id, attributes } },
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      },
    );

    server.tool(
      "delete_template",
      "Delete an email template by id.",
      { template_id: z.string() },
      async ({ template_id }) => {
        await klaviyoFetch(`/api/templates/${template_id}`, { method: "DELETE" });
        return { content: [{ type: "text", text: `Deleted template ${template_id}` }] };
      },
    );

    server.tool(
      "clone_template",
      "Clone an existing email template under a new name.",
      {
        template_id: z.string().describe("Source template ID"),
        name: z.string().describe("Name for the cloned template"),
        fields_template: z.string().optional().describe("Sparse fieldset for response"),
      },
      async ({ template_id, name, fields_template }) => {
        const data = await klaviyoFetch("/api/template-clone", {
          method: "POST",
          query: { "fields[template]": fields_template },
          body: {
            data: {
              type: "template-clone",
              attributes: { name },
              relationships: { template: { data: { type: "template", id: template_id } } },
            },
          },
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      },
    );

    server.tool(
      "render_template",
      "Render a template with a context payload to preview the resulting HTML.",
      {
        template_id: z.string(),
        context: z
          .record(z.any())
          .describe("Variable context for rendering, e.g. { profile: {...} }"),
        return_fields: z
          .array(z.string())
          .optional()
          .describe(
            "Sparse fieldset on the rendered output. Subset of: html, text, amp, name, editor_type.",
          ),
        fields_template: z.string().optional().describe("Sparse fieldset for response"),
      },
      async ({ template_id, context, return_fields, fields_template }) => {
        const attributes: Record<string, unknown> = { context };
        if (return_fields !== undefined) attributes.return_fields = return_fields;
        const data = await klaviyoFetch("/api/template-render", {
          method: "POST",
          query: { "fields[template]": fields_template },
          body: {
            data: {
              type: "template-render",
              attributes,
              relationships: { template: { data: { type: "template", id: template_id } } },
            },
          },
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      },
    );
  },
};
