# PalengkePay — User Feedback Google Form Fields

Create this form at forms.google.com. Share the link with test vendors and customers after the pilot.

---

## Section 1: About You

| # | Field | Type | Required | Options / Notes |
|---|-------|------|----------|-----------------|
| 1 | Full name | Short answer | No | |
| 2 | Email address | Short answer | No | For follow-up |
| 3 | Stellar wallet address | Short answer | No | G... format |
| 4 | I am a... | Multiple choice | Yes | Vendor / Customer / Market Admin / Just looking |
| 5 | Product type (vendors only) | Dropdown | No | Fish / Meat / Vegetables / Fruits / Rice & Grains / Spices / Other |

---

## Section 2: Overall Experience

| # | Field | Type | Required | Options / Notes |
|---|-------|------|----------|-----------------|
| 6 | Overall rating | Linear scale 1–5 | Yes | 1 = Very bad, 5 = Excellent |
| 7 | How easy was it to set up your wallet? | Linear scale 1–5 | Yes | 1 = Very difficult, 5 = Very easy |
| 8 | How easy was it to make or receive your first payment? | Linear scale 1–5 | Yes | 1 = Very difficult, 5 = Very easy |

---

## Section 3: Open Feedback

| # | Field | Type | Required | Options / Notes |
|---|-------|------|----------|-----------------|
| 9 | What did you like most about PalengkePay? | Paragraph | No | |
| 10 | What was confusing or hard to understand? | Paragraph | No | |
| 11 | Did anything break or not work? Please describe. | Paragraph | No | |
| 12 | What feature would you add or improve? | Paragraph | No | |
| 13 | Would you recommend PalengkePay to other vendors or customers? | Multiple choice | No | Yes, definitely / Maybe / No |

---

## Section 4: BNPL / Utang (optional — show only if role = Vendor or Customer)

| # | Field | Type | Required | Options / Notes |
|---|-------|------|----------|-----------------|
| 14 | Did you use the Utang (installment) feature? | Multiple choice | No | Yes / No / I didn't know it existed |
| 15 | How easy was it to create or accept an installment plan? | Linear scale 1–5 | No | 1 = Very difficult, 5 = Very easy |
| 16 | Do you trust the installment tracking shown in the app? | Linear scale 1–5 | No | 1 = Not at all, 5 = Completely |

---

## Form Settings

- **Title:** PalengkePay — Pilot Feedback
- **Description:** "Thank you for trying PalengkePay! Your feedback helps us improve. This takes about 3 minutes."
- **Confirmation message:** "Salamat! We've received your feedback and will use it to improve PalengkePay."
- **Collect email addresses:** Off (optional, to lower friction)
- **Response destination:** Google Sheet named `palengkepay-feedback`
