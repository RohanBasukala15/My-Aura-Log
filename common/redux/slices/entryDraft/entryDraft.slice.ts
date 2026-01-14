import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MoodEmoji } from '@common/models/JournalEntry';

interface EntryDraftState {
  selectedMood: MoodEmoji | null;
  journalText: string;
  selectedTags: string[];
  selectedEmotions: string[];
  selectedSleep: string[];
  selectedHealth: string[];
  selectedHobbies: string[];
  quickNote: string;
  photoUri: string | null;
  voiceMemoUri: string | null;
}

const initialState: EntryDraftState = {
  selectedMood: null,
  journalText: '',
  selectedTags: [],
  selectedEmotions: [],
  selectedSleep: [],
  selectedHealth: [],
  selectedHobbies: [],
  quickNote: '',
  photoUri: null,
  voiceMemoUri: null,
};

const entryDraftSlice = createSlice({
  name: 'entryDraft',
  initialState,
  reducers: {
    setMood: (state, action: PayloadAction<MoodEmoji | null>) => {
      state.selectedMood = action.payload;
    },
    setJournalText: (state, action: PayloadAction<string>) => {
      state.journalText = action.payload;
    },
    toggleTag: (state, action: PayloadAction<string>) => {
      const tag = action.payload;
      if (state.selectedTags.includes(tag)) {
        state.selectedTags = state.selectedTags.filter(t => t !== tag);
      } else {
        state.selectedTags.push(tag);
      }
    },
    toggleEmotion: (state, action: PayloadAction<string>) => {
      const emotion = action.payload;
      if (state.selectedEmotions.includes(emotion)) {
        state.selectedEmotions = state.selectedEmotions.filter(e => e !== emotion);
      } else {
        state.selectedEmotions.push(emotion);
      }
    },
    toggleSleep: (state, action: PayloadAction<string>) => {
      const sleep = action.payload;
      if (state.selectedSleep.includes(sleep)) {
        state.selectedSleep = state.selectedSleep.filter(s => s !== sleep);
      } else {
        state.selectedSleep.push(sleep);
      }
    },
    toggleHealth: (state, action: PayloadAction<string>) => {
      const health = action.payload;
      if (state.selectedHealth.includes(health)) {
        state.selectedHealth = state.selectedHealth.filter(h => h !== health);
      } else {
        state.selectedHealth.push(health);
      }
    },
    toggleHobby: (state, action: PayloadAction<string>) => {
      const hobby = action.payload;
      if (state.selectedHobbies.includes(hobby)) {
        state.selectedHobbies = state.selectedHobbies.filter(h => h !== hobby);
      } else {
        state.selectedHobbies.push(hobby);
      }
    },
    setQuickNote: (state, action: PayloadAction<string>) => {
      state.quickNote = action.payload;
    },
    setPhoto: (state, action: PayloadAction<string | null>) => {
      state.photoUri = action.payload;
    },
    setVoiceMemo: (state, action: PayloadAction<string | null>) => {
      state.voiceMemoUri = action.payload;
    },
    resetDraft: () => initialState,
  },
});

export const {
  setMood,
  setJournalText,
  toggleTag,
  toggleEmotion,
  toggleSleep,
  toggleHealth,
  toggleHobby,
  setQuickNote,
  setPhoto,
  setVoiceMemo,
  resetDraft,
} = entryDraftSlice.actions;

export default entryDraftSlice;
