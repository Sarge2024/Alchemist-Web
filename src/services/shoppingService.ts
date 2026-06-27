import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ShoppingListDoc, ShoppingItem } from '../types';

export const shoppingService = {
  // Pega o ID da lista ativa (por enquanto será fixa 'main_list' para a família)
  async getShoppingList(familyId: string): Promise<ShoppingListDoc | null> {
    if (!db) return null;
    try {
      const listRef = doc(db, `families/${familyId}/shoppingLists`, 'main_list');
      const snap = await getDoc(listRef);
      if (snap.exists()) {
        return snap.data() as ShoppingListDoc;
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar lista de compras:", error);
      return null;
    }
  },

  // Salva ou sobrescreve a lista inteira
  async saveShoppingList(list: ShoppingListDoc): Promise<void> {
    if (!db) throw new Error("Firestore não inicializado");
    try {
      const listRef = doc(db, `families/${list.familyId}/shoppingLists`, 'main_list');
      await setDoc(listRef, { ...list, updatedAt: Date.now() });
    } catch (error) {
      console.error("Erro ao salvar lista de compras:", error);
      throw error;
    }
  }
};
