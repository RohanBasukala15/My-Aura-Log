# My Aura Log MVP Setup Guide

## Overview
My Aura Log is an AI-powered mood journaling app built with React Native (Expo). This MVP includes core features for mood tracking, journaling, AI insights, and trend visualization.

## Features Implemented

### ✅ Core Features
1. **Mood Entry Screen** - Select mood, write journal entries, add tags
2. **AI Insights Integration** - OpenAI API integration for emotional analysis
3. **History Screen** - View all past journal entries with details
4. **Trends Screen** - Visualize mood patterns with charts
5. **Settings Screen** - Manage notifications and app data
6. **Daily Notifications** - Reminder notifications for journaling

### 📁 Project Structure
```
app/(home)/
  ├── dashboard.tsx    # Mood Entry/Journal Screen
  ├── history.tsx      # History of entries
  ├── trends.tsx       # Mood trends & charts
  ├── settings.tsx     # App settings
  └── _layout.tsx      # Tab navigation

common/
  ├── models/
  │   └── JournalEntry.ts    # Data models
  ├── services/
  │   ├── journalStorage.ts  # Local storage service
  │   └── openaiService.ts   # OpenAI API service
  └── components/theme/
      └── theme-palette.ts   # Updated with calming colors
```

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

**Note:** If you don't have an OpenAI API key, the app will use mock data for insights.

### 2. Install Dependencies
```bash
yarn install
```

### 3. Run the App
```bash
# Start Expo development server
yarn start

# Run on iOS
yarn ios

# Run on Android
yarn android
```

## App Configuration

### App Branding
- **Name:** My Aura Log
- **Bundle ID (iOS):** com.myauralog.app
- **Package (Android):** com.myauralog
- **Primary Color:** Lavender (#9B87F5)
- **Secondary Color:** Teal (#7DD3C0)

### Color Theme
The app uses a calming color palette:
- Primary: Lavender (#9B87F5)
- Secondary: Teal (#7DD3C0)
- Background: Soft lavender (#F8F6FF)
- Selected: Light lavender (#E8D5FF)

## Usage

### Creating a Journal Entry
1. Navigate to the **Journal** tab
2. Select your mood (😄 😐 😞 😡 😴)
3. Write your thoughts in the text area
4. Optionally add tags (work, health, family, etc.)
5. Tap "Save & Analyze"
6. View AI-generated insights

### Viewing History
1. Go to the **History** tab
2. Browse all your past entries
3. Tap any entry to see full details
4. Delete entries if needed

### Viewing Trends
1. Navigate to the **Trends** tab
2. See your mood over the last 7 days
3. View mood distribution statistics
4. Check your average mood score

### Settings
1. Go to the **Settings** tab
2. Enable/disable daily reminders
3. Clear all data if needed

## Data Storage

All journal entries are stored locally on the device using AsyncStorage. No data is sent to external servers except:
- OpenAI API for AI insights (if API key is configured)

## Notifications

Daily reminder notifications are scheduled at 9:00 AM by default. Users can enable/disable them in Settings.

## API Integration

### OpenAI API
The app uses OpenAI's `gpt-4o-mini` model to generate insights. The prompt structure:
- Analyzes journal entry text
- Returns emotion, summary, suggestion, and quote
- Handles errors gracefully with fallback responses

## Future Enhancements

- [ ] Cloud sync with Firebase
- [ ] User authentication
- [ ] Export entries as PDF
- [ ] Custom notification times
- [ ] Dark mode
- [ ] More mood options
- [ ] Entry search and filtering
- [ ] Monthly/yearly trend views

## Troubleshooting

### TypeScript Errors
Some TypeScript linter errors may appear but are false positives. The app should run correctly despite these warnings.

### OpenAI API Errors
If the API key is not set or invalid, the app will use mock data. Check your `.env` file and ensure the key is correct.

### Storage Issues
If entries are not saving, check AsyncStorage permissions. The app requires local storage access.

## Notes

- The app is currently MVP and uses local storage only
- No authentication required for MVP
- All data is stored locally
- OpenAI API key is optional (mock data will be used if not set)

