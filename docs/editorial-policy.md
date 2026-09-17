# Editorial and scholarly review policy

## Principles

Every public item must be traceable to structured citations and reviewed by a
qualified human. AI systems can organize source text and draft dialogue; they
cannot assign authenticity, approve a translation, or publish.

Authenticity values have distinct meanings:

- `sahih`: supported by a citation whose relevant grading is documented.
- `hasan`: supported by a documented hasan grading.
- `athar`: a report from or about early Muslims, labeled as such rather than
  presented as Prophetic hadith.
- `historical`: historical literature whose evidentiary limits are explained.

## Workflow

1. An editor enters the source text and structured citations.
2. Any generated script/audio is stored privately with `draft` or
   `review_required` status.
3. A qualified reviewer checks Arabic and English text, translation, names,
   dates, context, grading, citations, age appropriateness, voice license, and
   audio/timeline alignment.
4. Approval records reviewer identity, timestamp, revision snapshot, and change
   summary.
5. Publication is performed by a different administrator. Database constraints
   reject reviewed/published records without the required audit fields.
6. Approved media is copied to a new immutable public MinIO key. Draft buckets
   remain private.

Kids Mode receives a separate family-safety review for frightening detail,
developmental language, links, and calls to action. “Family-friendly” does not
replace scholarly review.

## Corrections

Correction reports go to corrections@storiesofislam.example and must include the
item URL, claim, and supporting citation. Triage within the editorial queue:

- Critical doctrinal, attribution, privacy, or safety issue: archive immediately.
- Material citation/translation issue: unpublish pending re-review.
- Typographical issue: correct through a new revision.

Never rewrite a published item without preserving its prior revision. Record the
decision and notify reporters when contact details are available.

Replace example-domain contacts and record reviewer qualification criteria
before launch.
