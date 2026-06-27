import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Profile, Family } from '../types';

export const userService = {

  // ==========================================
  // FAMILY RESOLUTION & CREATION
  // ==========================================

  // Descobre a qual família o usuário pertence (mapeamento)
  async getUserFamilyId(uid: string): Promise<string | null> {
    if (!db) return null;
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data().familyId) {
        return userSnap.data().familyId as string;
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar mapeamento de usuário:", error);
      return null;
    }
  },

  // Cria uma nova Família para um usuário Master (primeiro login)
  async createFamilyForUser(uid: string, userData: { name: string, email: string, avatar?: string }): Promise<{ familyId: string, profile: Profile }> {
    if (!db) throw new Error("Firestore não inicializado");
    
    // Gerar um ID de família baseado no UID
    const familyId = `fam_${uid}`;
    
    // 1. Criar a Família
    const newFamily: Family = {
      id: familyId,
      name: `Família ${userData.name.split(' ')[0]}`,
      adminUid: uid,
      createdAt: Date.now()
    };
    await setDoc(doc(db, 'families', familyId), newFamily);

    // 2. Mapear o usuário para esta Família
    await setDoc(doc(db, 'users', uid), { familyId });

    // 3. Criar o perfil Master dentro da subcoleção members da família
    const masterProfile = this._generateDefaultProfile(uid, {
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      isMainAccount: true,
      role: "Admin Principal",
      relationship: "Eu mesmo(a)",
      familyId: familyId
    });

    await setDoc(doc(db, `families/${familyId}/members`, uid), masterProfile);

    return { familyId, profile: masterProfile };
  },

  // ==========================================
  // MEMBER MANAGEMENT (CRUD)
  // ==========================================

  // Busca todos os membros de uma família
  async getFamilyMembers(familyId: string): Promise<Profile[]> {
    if (!db) return [];
    try {
      const membersRef = collection(db, `families/${familyId}/members`);
      const snapshot = await getDocs(membersRef);
      return snapshot.docs.map(doc => doc.data() as Profile);
    } catch (error) {
      console.error("Erro ao buscar membros da família:", error);
      return [];
    }
  },

  // Adiciona um novo dependente à família
  async addDependent(familyId: string, data: Partial<Profile>): Promise<Profile> {
    if (!db) throw new Error("Firestore não inicializado");
    
    const newMemberId = `dep_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const newProfile = this._generateDefaultProfile(newMemberId, {
      ...data,
      isMainAccount: false,
      familyId: familyId
    });

    await setDoc(doc(db, `families/${familyId}/members`, newMemberId), newProfile);
    return newProfile;
  },

  // Atualiza os dados de qualquer membro
  async updateMemberProfile(familyId: string, memberId: string, data: Partial<Profile>): Promise<void> {
    if (!db) throw new Error("Firestore não inicializado");
    try {
      const memberRef = doc(db, `families/${familyId}/members`, memberId);
      await updateDoc(memberRef, data);
    } catch (error) {
      console.error("Erro ao atualizar perfil do membro:", error);
      throw error;
    }
  },
  
  // Remove um dependente
  async deleteMember(familyId: string, memberId: string): Promise<void> {
    if (!db) throw new Error("Firestore não inicializado");
    try {
      await deleteDoc(doc(db, `families/${familyId}/members`, memberId));
    } catch (error) {
      console.error("Erro ao excluir membro:", error);
      throw error;
    }
  },

  // ==========================================
  // HELPERS
  // ==========================================
  
  _generateDefaultProfile(id: string, overrides: Partial<Profile>): Profile {
    const defaultName = overrides.name || "Novo Membro";
    return {
      id,
      name: defaultName,
      avatar: overrides.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(defaultName)}&background=003527&color=fff`,
      role: overrides.role || "Membro",
      isMainAccount: false,
      relationship: overrides.relationship || "Outro",
      phone: overrides.phone || "",
      dietaryProtocol: overrides.dietaryProtocol || [],
      mainMetric: overrides.mainMetric || "100g Meta de Proteína",
      metricValue: overrides.metricValue || 100,
      metricLabel: overrides.metricLabel || "Proteína",
      progressPercentage: overrides.progressPercentage || 0,
      email: overrides.email || "",
      interfaceLanguage: "pt-BR",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      measurementSystem: "metric",
      dailyCalories: overrides.dailyCalories || 2000,
      proteinPercentage: overrides.proteinPercentage || 30,
      carbsPercentage: overrides.carbsPercentage || 40,
      fatPercentage: overrides.fatPercentage || 30,
      allergies: overrides.allergies || [],
      medications: overrides.medications || "",
      familyId: overrides.familyId,
      ...overrides
    };
  }
};
