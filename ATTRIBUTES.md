# Life RPG Attributes

This document defines the six core attributes for the Life RPG system, their scope, and how to categorize habits, tasks, and logged activities.

---

## Overview

| Code | Name | Icon | Core Theme |
|------|------|------|------------|
| PWR | Power | 💪 | Physical strength and fitness |
| KNW | Knowledge | 📖 | Learning and cognitive development |
| VIT | Vitality | 🧡 | Bodily health and medical wellness |
| WEL | Wellness | 🧘 | Mental health, recovery, and boundaries |
| DSC | Discipline | ⚡ | Self-governance, maintenance, follow-through |
| SOC | Social | 🤝 | Relationships and social connection |

---

## Attribute Definitions

### PWR — Power 💪
**Theme:** Physical strength, endurance, and athletic capacity

**Covers:**
- Structured exercise and workouts
- Strength training
- Cardio and endurance activities
- Physical challenges

**Examples:**
- Weightlifting session
- Running, cycling, swimming
- Bodyweight workouts
- Sports participation

**Current habit mapping:** `workout` → PWR

---

### KNW — Knowledge 📖
**Theme:** Intellectual growth, learning, and focused work

**Covers:**
- Reading and studying
- Deep focus sessions
- Skill acquisition
- Information consumption with intent
- Creative/technical projects requiring concentration

**Examples:**
- Reading 20+ minutes
- Pomodoro/focus sessions
- Learning a new skill
- Taking a course
- Writing or coding projects

**Current habit mapping:** `read20Min` → KNW

**Auto-XP:**
- Focus sessions award +15 KNW XP

---

### VIT — Vitality 🧡
**Theme:** Bodily health, nutrition, and medical self-care

**Covers:**
- Nutrition and eating habits
- Medical adherence (medication, treatments)
- Body metrics (weight, blood pressure, etc.)
- Physical health monitoring
- Preventive care

**Examples:**
- Logging nutrition/meals
- Taking prescribed medication
- Weighing in
- Blood pressure checks
- Doctor appointments
- Supplement routines

**Current habit mapping:**
- `medication` → VIT

**Auto-XP:**
- Nutrition logging awards +10 VIT XP
- Weight logging awards +10 VIT XP
- Blood pressure logging awards +10 VIT XP

---

### WEL — Wellness 🧘
**Theme:** Mental health, recovery, and psychological boundaries

**Covers:**
- Sleep quality and quantity
- Stress management
- Digital boundaries (screen time limits)
- Mindfulness and meditation
- Mental hygiene practices
- Saying no / protecting energy

**Examples:**
- Getting adequate sleep
- Digital sunset (off screens by set time)
- Meditation or breathwork
- Journaling for mental clarity
- Therapy or counseling
- Taking mental health days

**Current habit mapping:**
- `digitalSunset` → WEL

**Auto-XP:**
- Sleep logging awards +10 WEL XP

---

### DSC — Discipline ⚡
**Theme:** Self-governance, life maintenance, and follow-through

**Covers:**
- Financial management and habits
- Home maintenance and cleaning
- Administrative tasks
- Repairs and upkeep
- Errands and logistics
- Consistency in boring-but-necessary tasks

**Examples:**
- Budgeting or financial reviews
- Paying bills on time
- Cleaning and organizing (e.g., closet, kitchen, bathroom)
- Doing dishes and laundry
- Home repairs and furniture logistics (e.g., purchasing a new couch)
- Car maintenance
- Filing taxes or paperwork
- Building savings / emergency fund

**Current habit mapping:** *(none yet — add here as habits are created)*

**Auto-XP:**
- Financial logging awards +10 DSC XP (recommended)

---

### SOC — Social 🤝
**Theme:** Relationships, community, and social connection

**Covers:**
- Intentional social interaction
- Relationship maintenance
- Community participation
- Communication skills practice
- Networking (when intentional)

**Examples:**
- Meeting friends or family
- Initiating conversation with strangers
- Calling someone to catch up
- Attending social events
- Resolving conflicts
- Active listening practice

**Current habit mapping:**
- `socialInteraction` → SOC

---

## Categorization Guidelines

### When Adding a New Habit

Ask these questions in order:

1. **Is this about learning or focused work?** → KNW
2. **Is this about physical fitness/exercise?** → PWR
3. **Is this about bodily health or medical care?** → VIT
4. **Is this about mental recovery or boundaries?** → WEL
5. **Is this about relationships or social connection?** → SOC
6. **Is this about life maintenance, admin, or finances?** → DSC

### Common Edge Cases

| Activity | Attribute | Reasoning |
|----------|-----------|-----------|
| Meal prep | VIT | Nutrition = bodily health |
| Cleaning out fridge | DSC | Maintenance task |
| Doing laundry or dishes | DSC | Practical life maintenance |
| Organizing closet | DSC | Practical maintenance / order |
| Life organizing brain dump | KNW | Cognitive organization / mental work |
| Purchasing furniture (e.g., new couch) | DSC | Home logistics / environment upkeep |
| Yoga for flexibility | PWR | Physical training |
| Yoga for stress relief | WEL | Mental recovery |
| Reading fiction | KNW | Cognitive engagement |
| Reading to fall asleep | WEL | Sleep hygiene |
| Budgeting | DSC | Financial maintenance |
| Taking a course on investing | KNW | Learning new skills |
| Therapy | WEL | Mental health |
| Calling to dispute a bill | DSC | Admin task |
| Calling a friend | SOC | Relationship maintenance |
| Gym session | PWR | Strength training |
| Taking vitamins | VIT | Medical/nutritional adherence |

---

## Code Reference

### Frontend (React)
Location: `health_dashboard/client/src/components/dashboard/AttributesView.tsx`

```typescript
const ATTRIBUTES = {
  PWR: { label: 'Power', icon: '💪', color: 'text-orange-500', bg: 'bg-orange-500/10', text: '#f97316' },
  KNW: { label: 'Knowledge', icon: '📖', color: 'text-indigo-400', bg: 'bg-indigo-400/10', text: '#818cf8' },
  AGI: { label: 'Agility', icon: '🍃', color: 'text-teal-500', bg: 'bg-teal-500/10', text: '#14b8a6' },  // DEPRECATED
  DSC: { label: 'Discipline', icon: '⚡', color: 'text-yellow-500', bg: 'bg-yellow-500/10', text: '#eab308' },  // NEW
  WEL: { label: 'Wellness', icon: '🧘', color: 'text-emerald-500', bg: 'bg-emerald-500/10', text: '#10b981' },
  VIT: { label: 'Vitality', icon: '🧡', color: 'text-rose-400', bg: 'bg-rose-400/10', text: '#fb7185' },
  SOC: { label: 'Social', icon: '🤝', color: 'text-amber-500', bg: 'bg-amber-500/10', text: '#f59e0b' }
};
```

### Backend (Habit Mappings)
Location: `health_dashboard/src/services/habitService.js`

```javascript
const HABIT_ATTRIBUTES = {
  'workout': 'PWR',
  'read20Min': 'KNW',
  'digitalSunset': 'WEL',
  'socialInteraction': 'SOC',
  'medication': 'VIT'
  // Add DSC habits here as needed
};
```

---

## Migration Notes

- **AGI (Agility)** has been deprecated and replaced with **DSC (Discipline)**
- Any existing AGI XP should be manually reviewed and potentially reassigned
- VIT scope narrowed to physical health only (previously included too much)
- WEL scope clarified to mental health and recovery
- DSC is new and will need habit mappings added over time

---

*Last updated: 2026-02-20*
