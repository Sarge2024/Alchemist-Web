import { Profile } from "../types";

export interface DietaryAssessmentResult {
  baseDiet: string;
  variants: string[];
  prescriptionText: string;
  calculatedCalories: number;
  calculatedMacros: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const dietaryAssessmentService = {
  assessProfile: (profile: Profile): DietaryAssessmentResult => {
    // 1. Regra A: Cálculo Energético (Mifflin-St Jeor)
    let tmb = 1500; // Default fallback se faltarem dados
    const age = profile.age || 30;
    const weight = profile.weight || 70;
    const height = profile.height || 170;
    
    // Mifflin-St Jeor:
    // Homens: (10 x peso) + (6.25 x altura) - (5 x idade) + 5
    // Mulheres: (10 x peso) + (6.25 x altura) - (5 x idade) - 161
    if (profile.gender === "male") {
      tmb = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      tmb = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    // Fator de Atividade
    let activityFactor = 1.3; // Sedentary default
    if (profile.activityLevel === "light") activityFactor = 1.375;
    else if (profile.activityLevel === "moderate") activityFactor = 1.55;
    else if (profile.activityLevel === "active") activityFactor = 1.725;
    else if (profile.activityLevel === "very_active") activityFactor = 1.9;

    let totalCalories = Math.round(tmb * activityFactor);

    // Ajuste de Emagrecimento ou Desnutrição
    const imc = weight / ((height / 100) * (height / 100));
    let energyModifier = "";
    
    if (profile.dietGoal === "weight_loss" && imc > 25) {
      totalCalories -= 500; // Déficit
      energyModifier = "Restrita em Energia (Hipocalórica)";
    } else if (profile.comorbidities?.includes("malnutrition") || imc < 18.5) {
      totalCalories += 500; // Superávit
      energyModifier = "Reforçada em Energia (Hipercalórica e Hiperproteica)";
    } else if (profile.dietGoal === "muscle_gain") {
      totalCalories += 300;
    }

    // Default Macros
    let pPct = profile.proteinPercentage || 25;
    let cPct = profile.carbsPercentage || 45;
    let fPct = profile.fatPercentage || 30;

    // 2. Regra B: Dieta Base (Textura/Consistência)
    let baseDiet = "Dieta Geral / Livre";
    if (profile.mechanicalCapacity === "dysphagia_mild" || profile.mechanicalCapacity === "no_teeth") {
      baseDiet = "Dieta Pastosa / Cremosa";
    } else if (profile.mechanicalCapacity === "moderate_difficulty") {
      baseDiet = "Dieta Branda / Mole";
    }

    // 3. Regra C: Variantes Terapêuticas (Comorbidades)
    const variants: string[] = [];
    if (energyModifier) variants.push(energyModifier);
    
    const comorb = profile.comorbidities || [];
    if (comorb.includes("diabetes")) {
      variants.push("Adaptada para Diabetes (Normoglicídica)");
    }
    if (comorb.includes("hypertension") || comorb.includes("ckd") || comorb.includes("cv_risk")) {
      variants.push("Restrita em Sal (Hipossódica)");
    }
    if (comorb.includes("dyslipidemia") || comorb.includes("cv_risk")) {
      variants.push("Hipolipídica");
      fPct = 25; // Abaixa limite de gordura em sugestão
    }
    if (comorb.includes("gerd")) {
      variants.push("Sem Estimulantes Gástricos");
    }

    // Intolerâncias / Alergias
    const restrs = profile.dietaryRestrictions || [];
    if (restrs.includes("Sem Glúten")) variants.push("Isenta de Glúten");
    if (restrs.includes("Sem Lactose")) variants.push("Isenta de Lactose");
    if (restrs.includes("Vegano")) variants.push("Plant-Based (Vegana)");

    // 4. Regra D: Ajuste Fino
    if (profile.intestinalTransit === "constipation") {
      variants.push("Laxativa (Rica em Fibras)");
    } else if (profile.intestinalTransit === "diarrhea") {
      variants.push("Constipante");
    }

    if (profile.dietGoal === "weight_loss" && comorb.includes("dyslipidemia")) {
      variants.push("Estratégia Low-Carb");
      cPct = 30; pPct = 35; fPct = 35;
    }

    const prescriptionText = variants.length > 0 
      ? `${baseDiet}, ${variants.join(", ")}.`
      : `${baseDiet}.`;

    return {
      baseDiet,
      variants,
      prescriptionText,
      calculatedCalories: Math.max(1200, totalCalories), // hard cap mínimo
      calculatedMacros: {
        protein: pPct,
        carbs: cPct,
        fat: fPct
      }
    };
  }
};
