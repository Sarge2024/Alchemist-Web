import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { RecipeSuggestion } from "../types";

export const suggestionService = {
  submitSuggestion: async (data: { title?: string; text?: string; url?: string }, submittedBy: string, familyId?: string): Promise<string> => {
    try {
      const payload: Omit<RecipeSuggestion, "id"> = {
        title: data.title || "",
        text: data.text || "",
        url: data.url || "",
        submittedBy,
        familyId: familyId || "",
        createdAt: Date.now(),
        status: 'pending_review'
      };

      const docRef = await addDoc(collection(db, "recipe_suggestions"), payload);
      return docRef.id;
    } catch (error) {
      console.error("Error submitting recipe suggestion:", error);
      throw error;
    }
  }
};
