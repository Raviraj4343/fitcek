Frontend wireframes and component spec

Overview
- Purpose: Map UI pages to backend APIs and list components with props.
- Keep designs minimal and reuse existing `ui/` components.

Pages

- Landing (/)
  - Hero, CTA to Sign Up/Sign In

- Auth (/signin, /signup, /auth)
  - SignIn: email, password -> `login()`
  - Signup: name, email, password -> `signup()`
  - EmailVerify: reads token query -> `verifyEmail(token)`

- Profile Setup (/profile)
  - Form: age, gender, heightCm, weightKg, bodyFatPercent, goal, activityLevel, dietPreference
  - Submit -> `setupProfile(payload)`

- Dashboard (/dashboard)
  - Cards: Health score, today's calories/protein, weight trend
  - Quick actions: Log weight, Add meal, Vitals
  - Data sources: `getTodayInsight()`, `getTodayLog()`, `getWeightHistory()`

- Daily Log (/daily)
  - Today editor: water, sleep, steps, meals
  - Meal item: search food -> `searchFoods(q)` -> add quantity -> `updateMealSection(date,payload)`
  - Save vitals -> `updateVitals(date,payload)`

- Weight (/weight)
  - Log weight -> `logWeight(payload)`
  - History list/chart -> `getWeightHistory({days})`, `getWeeklyWeightSummary()`

- Foods (/foods)
  - Search page using `searchFoods(q)`
  - Category list from `getFoodCategories()`
  - Food detail -> `getFoodById(id)`

- Insights (/insights)
  - Today's insights: `getTodayInsight()`
  - Weekly summary: `getWeeklySummary()`

Core components

- `SearchAutocomplete` / `FoodSearch`
  - props: `onSelect(food)`, `placeholder`
  - calls `searchFoods(q)` and shows suggestions

- `DailyLogEditor`
  - props: `date`, `log`, `onSave`
  - handles vitals and meals UI

- `WeightChart`
  - props: `data` ([{date, weightKg}])

- `AuthContext`
  - Provides: `user`, `loading`, `login()`, `logout()`, `refresh()`
  - On mount: call `getMe()` to populate user

Notes
- Backend uses cookies by default; client uses `credentials: 'include'`.
- Use `react-hook-form` + `yup` for validation (optional). 
