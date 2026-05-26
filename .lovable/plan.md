Simplify MIA component to 2 key items only

## Current State
- MIA shows 5 items: Missing info flags, Document summary, Inconsistency flags, Suggested advisor questions, Risk notes
- User wants to reduce to 2 items only

## Change
- Update `src/components/MiaInsights.tsx`
- Keep: Missing information flags, Risk notes
- Remove: Document summary, Inconsistency flags, Suggested advisor questions
- Also remove unused Lucide icons from import (FileSearch, MessageCircleQuestion)
