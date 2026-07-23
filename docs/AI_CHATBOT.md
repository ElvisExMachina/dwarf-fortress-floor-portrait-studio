# AI Chatbot Design Workflow

The **AI Design Desk** uses a transparent copy/paste contract. It does not connect to a chatbot API, store an API key, or depend on a particular provider.

Any cloud or local AI chatbot that can follow detailed instructions and return strict JSON can propose a compatible floor portrait. Examples include ChatGPT, Claude, Gemini, Microsoft Copilot, and instruction-following local models. These are examples, not required services or endorsements.

## Step-by-step workflow

1. In the Studio, enter the design idea.
2. Set the width and height. Each cell represents one constructed floor tile.
3. Add style guidance, such as symmetry, a strong silhouette, or limited detail.
4. Select the background material.
5. Optionally enter a restricted list of material IDs. This makes designs easier to build and improves reliability with smaller models.
6. Click **Copy AI chatbot request**.
7. Paste the complete request into the chatbot of your choice.
8. Copy the chatbot's entire JSON-only response.
9. Paste it into **Chatbot design JSON**.
10. Click **Validate and import design**.

The Studio validates the complete response before changing the canvas. Import is atomic: invalid input does not partially alter the current project.

## Good starting settings

- Start with an 8×8 to 24×24 design while exploring an idea.
- Use a restricted palette of three to six materials.
- Ask for a strong silhouette and symmetry when the design must read from a distance.
- Increase dimensions only after the composition works; larger designs require substantially more JSON.
- Smaller local models are more reliable with modest dimensions and fewer materials.

The Studio supports dimensions up to 100×100, but chatbot context and output limits may make very large generated plans impractical.

## Required JSON contract

The chatbot must return exactly one JSON object with no Markdown fence, preface, explanation, or trailing commentary:

```json
{
  "version": 1,
  "name": "Gold Rune",
  "width": 8,
  "height": 8,
  "background": "obsidian",
  "runs": [
    { "y": 1, "x": 3, "length": 2, "material": "native-gold" },
    { "y": 6, "x": 3, "length": 2, "material": "malachite" }
  ]
}
```

Rules:

- `version` must be `1`.
- `name` must be a non-empty string.
- `width` and `height` must be integers from 1 through 100.
- `background` and every `material` must be IDs included in the copied request.
- Coordinates are zero-based.
- Every run is horizontal.
- `y` and `x` must be inside the design.
- `length` must be a positive integer and the run must not extend past the design width.
- Runs may overlap; later runs win.
- Cells omitted from `runs` use the background.

A verified example is available at [`qa/qa-gold-rune.json`](../qa/qa-gold-rune.json).

## Correcting a rejected response

The importer reports specific errors without changing the canvas. Copy the exact error back to the same chatbot and say:

> Correct the JSON using the original request and this validation error. Return exactly one corrected JSON object with no Markdown or explanation: **[paste the Studio error here]**

Common failures:

| Problem | Correction |
|---|---|
| Response contains a Markdown code fence | Request one raw JSON object only, or remove the fence before importing. |
| Unknown material ID | Ask the chatbot to use only IDs listed in the original request. |
| Run extends past the width | Give the chatbot the validation error and ask it to recalculate `x` and `length`. |
| Wrong dimensions | Ask it to preserve the exact requested `width` and `height`. |
| Truncated response | Reduce the dimensions or palette and generate again. |
| Design is too noisy | Ask for fewer materials, stronger symmetry, and a simpler silhouette. |

## Privacy and integration boundary

The Studio sends no prompt or design to an external service. You decide where to paste the generated request, and that chatbot's privacy, retention, and training policies apply to the text you provide.

This workflow is broadly portable because it exchanges plain text and schema-validated JSON. It does **not** provide direct sign-in, API calls, automatic model selection, tool access, filesystem access, or agent orchestration. A direct chatbot integration would require a separate provider adapter and credential flow; none is included in the Studio.
