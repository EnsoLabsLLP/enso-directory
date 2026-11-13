# Enso practitioner taxonomy

The option lists behind a practitioner's listing. Each field is a multi-select: a practitioner picks as many options as apply, and can add a custom one when nothing fits.

| File | Field on the listing | Items | Grouped by |
| --- | --- | --- | --- |
| `concerns.json` | **Can help with** | 62 | 10 categories |
| `client-groups.json` | **I work with** | 26 | 3 categories (format, age group, life stage & community) |
| `approaches.json` | **Ways of working** | 52 | 7 categories |
| `languages.json` | **Languages** | 27 | none |

## Shape

Every file has the same outline:

```jsonc
{
  "name": "Can help with",          // field label
  "version": 1,
  "featured": ["anxiety", "..."],    // optional: ids to show first (tiles, suggestion chips)
  "categories": [                    // optional: groups for the picker and filters, in display order
    { "id": "anxiety-stress", "label": "Anxiety & stress", "icon": "wind" }
  ],
  "items": [
    {
      "id": "anxiety",               // stable key, never changes, store this
      "label": "Anxiety",            // what people see
      "category": "anxiety-stress",
      "icon": "wind",                // Tabler icon name
      "description": "Constant worry, restlessness or ...",
      "aliases": ["gad", "worry"]    // other spellings that should map to this item
    }
  ]
}
```

Extra fields by file:

- **concerns.json**: `crisisNote: true` on *Self-harm* and *Suicidal thoughts*. When a client picks either, show the file's top-level `crisisNote` text (112 and Tele-MANAS 14416).
- **client-groups.json**: `ages` on age groups (for example `"13–17"`). Show it next to the label.
- **approaches.json**: `short` is the chip label (e.g. "CBT") and `name` is the full name (e.g. "Cognitive behavioural therapy (CBT)"). `creative: true` marks creative and expressive therapies. `goodFor` lists the concern ids an approach is commonly used for, which you can use for "people who need X often look for Y" hints. Practitioners can mark any approach as in training. Store it as the label plus the `inTrainingSuffix`, e.g. "Somatic (in training)".
- **languages.json**: `native` is the language's name in its own script.

## Icons

All icons are from [Tabler Icons](https://tabler.io/icons) v3, outline style (MIT licence). Every name in these files has been checked against v3.39.0.

- React: `npm i @tabler/icons-react`. Convert the name to PascalCase and add an `Icon` prefix: `wind` becomes `IconWind`, `heart-handshake` becomes `IconHeartHandshake`, `device-gamepad-2` becomes `IconDeviceGamepad2`.
- Web font or SVG sprite: `npm i @tabler/icons-webfont`, then `<i class="ti ti-wind"></i>`.
- Plain SVG: `https://unpkg.com/@tabler/icons@3.39.0/icons/outline/wind.svg`.

The directory renders them at 24×24 with a stroke width of 1.75.

## Matching stored values

Match free text such as an old sheet value or a custom entry like this:

1. Lower-case it.
2. Replace anything that is not a letter or digit with a space, then trim.
3. Compare it against each item's `id`, `label`, `short`, `name` and `aliases`.

No two items in the same file share a key, so a match is never ambiguous. If nothing matches, keep the text as a custom option rather than dropping it.

Older listings put *Teens* and *Couples* under Can help with. Those now belong to I work with (`adolescents` and `couples`), so move them across when you read old data.
