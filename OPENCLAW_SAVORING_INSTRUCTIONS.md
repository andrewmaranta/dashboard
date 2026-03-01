# OpenClaw Enactive Mastery Integration

Ruby (OpenClaw), this file dictates your role in maintaining the "Enactive Mastery Highlight Reel" feature in the Life Dashboard. 

## Objective
Your goal is to perform a weekly database analysis to identify the user's hidden patterns of success, health milestones, cognitive shifts, and behavioral streaks, and log them into the `savoring_insights` table. The dashboard will display these to the user to help them "re-weight" their negative priors (a concept from Bayesian psychology and ACT) and build psychological resilience.

## Database Location
`health_dashboard/data/life.db` (SQLite)

## Target Table Schema: `savoring_insights`
- `id` INTEGER PRIMARY KEY
- `category` TEXT (e.g., 'health', 'habit', 'quest', 'pattern', 'somatic', 'finance', 'focus', 'cognitive')
- `title` TEXT (e.g., 'Weight Loss Milestone', 'Relentless Discipline', 'Nervous System Regulation', 'Deep Work Mastery')
- `description` TEXT (A psychological, supportive explanation of what they achieved and why it matters)
- `icon` TEXT (A single relevant emoji, e.g., '📉', '🔥', '🧘', '🧠', '💰')
- `created_at` DATETIME (Handled automatically)

## Data Sources for Analysis (Comprehensive List)
You have full access to `life.db`. Query the following tables to find deep, cross-domain insights:

### Behavioral & Action Tracking
1. **`habits_log` / `daily_quests`**: Look at consistency. Has a notoriously difficult habit or quest reached a long streak or high completion rate this week?
2. **`tasks`**: Look at `completed = 1` and `completed_at` in the last week. Did they complete several 'hard' or 'epic' difficulty tasks?
3. **`protocols` (If-Then)**: Look at the `hits` counter. Are they successfully automating new habits by hitting their triggers consistently?

### Health & Biology
4. **`weight_history` / `blood_pressure` / `sleep_log`**: Look for positive trends over the past 7-30 days. Dropped a pound? Improved sleep duration/quality? Stabilized blood pressure?
5. **`nutrition_log`**: Are they consistently hitting their protein floor (120g) or staying under their calorie ceiling (1500 kcal)?
6. **`health_symptoms`**: Have negative symptoms decreased in frequency or severity?

### Psychology & Focus
7. **`attribute_state_logs`**: Look at `value`/`intensity`. Are they spending more time in high-capability states?
8. **`focus_sessions`**: Calculate total deep work hours. Did they achieve a high volume of focused Pomodoros this week?
9. **`beliefs` / `belief_evidence`**: Have they logged new evidence that counters a negative belief? Has the `confidence` score in a limiting prior dropped?

### Resources
10. **`finance`**: Have savings increased? Did they stick to a budget?

## How to Formulate Insights
When you find a success pattern, do not just state the data. Frame it psychologically to build **self-efficacy**:

**BAD:** "You lost 2 pounds this week."
**GOOD:** "You dropped 2 lbs this week, maintaining a steady downward trend. This is a direct result of your consistency in hitting your 120g protein floor and 1500 kcal ceiling."

**BAD:** "You have a 5-day streak on 'Read 20 pages'."
**GOOD:** "You've successfully engaged your 'Knowledge' attribute for 5 consecutive days. This builds the enactive mastery required to permanently shift your behavioral baseline."

**BAD:** "You did 10 hours of focus sessions."
**GOOD:** "You logged 10 hours of deep, uninterrupted focus. By ruthlessly defending your attention, you are actively rewiring your brain for sustained cognitive endurance."

**BAD:** "You added 3 pieces of evidence to a belief."
**GOOD:** "You actively dismantled a rigid negative prior this week by logging 3 concrete pieces of disconfirming evidence. Your cognitive flexibility is measurably increasing."

## Execution Protocol
When requested (or if you set up a cron schedule):
1. Read the `life.db` database using standard SQLite queries, looking for cross-table correlations.
2. Analyze the data for 2-3 deep insights that highlight the user's agency and capability.
3. Execute `INSERT INTO savoring_insights (category, title, description, icon) VALUES (...)` queries for each insight.
4. The dashboard will automatically pull and display these to the user in the "Stats -> Savor" tab.