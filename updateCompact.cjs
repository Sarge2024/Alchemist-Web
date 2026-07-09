const fs = require('fs');
const path = '/mnt/46F84CA3F84C935B/SAGACITAS_SaaS/AlchymistWeb/Alchymist-Web/src/components/CompactWeeklyPlanner.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add visibleRecipesCount
content = content.replace(
  'const [targetSlot, setTargetSlot] = useState<{dayIndex: number, mealIndex: number, courseIndex: number} | null>(null);',
  'const [targetSlot, setTargetSlot] = useState<{dayIndex: number, mealIndex: number, courseIndex: number} | null>(null);\n  const [visibleRecipesCount, setVisibleRecipesCount] = useState(10);'
);

// 2. Limit 50 -> 500
content = content.replace('limit: 50', 'limit: 500');

// 3. Reset limit in recipeModalOpen
content = content.replace(
  "setRecipeModalOpen(true);",
  "setRecipeModalOpen(true);\n      setVisibleRecipesCount(10);"
);

// 4. Update filtering logic and map
const oldFilterBlock = `
                    <div className="flex flex-col gap-3">
                      {availableRecipes
                        .filter(recipe => {
                          if (!targetSlot || !weeklyPlan) return true;
                          const currentPeriod = weeklyPlan.days[targetSlot.dayIndex].meals[targetSlot.mealIndex].name;
                          const courseType = weeklyPlan.days[targetSlot.dayIndex].meals[targetSlot.mealIndex].courses[targetSlot.courseIndex].type;
                          
                          // 1. Perfil ativo aprovação
                          if (activeProfile?.approvedRecipes && activeProfile.approvedRecipes.length > 0) {
                            const isApproved = activeProfile.approvedRecipes.some(r => r.recipeId === recipe.id && r.period === currentPeriod);
                            if (!isApproved) return false;
                          }
                          
                          // 2. Filtro pela Categoria do Slot (courseType)
                          const p = recipe.tipo_prato || [];
                          const m = recipe.momento || [];
                          
                          const isDrink = p.includes("Bebidas") || m.includes("Bebidas");
                          const isDessert = p.includes("Doces e Sobremesas");
                          const isSnack = m.includes("Lanche / Chá da Tarde") || m.includes("Petiscos&Food Tricks") || p.includes("Padaria e Pastelaria");
                          const isStarter = m.includes("Entradas") || p.includes("Saladas e Pratos Frios") || m.includes("Sopas e Caldos");

                          switch (courseType) {
                            case "Entrada":
                              return isStarter || isSnack;
                            case "Sobremesa":
                              return isDessert;
                            case "Bebida":
                              return isDrink;
                            case "Lanche":
                              return isSnack || isDessert || p.includes("Massas e Risotos");
                            case "Prato Principal":
                              if (isDrink || isDessert || m.includes("Entradas") || p.includes("Bebidas")) return false;
                              return true;
                            default:
                              return true;
                          }
                        })
                        .map((recipe) => (
                        <div
                          key={recipe.id}
                          className="border border-outline-variant/30 rounded-xl p-2 flex gap-3 items-center hover:border-primary active:bg-sage-wash cursor-pointer transition-all bg-white"
                          onClick={() => handleSelectRecipe(recipe)}
                        >
                          <img
                            src={recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80"}
                            alt={recipe.title}
                            className="w-14 h-14 rounded-lg object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-primary truncate">
                              {recipe.title}
                            </h4>
                            <span className="font-sans text-[10px] text-scientific-gray uppercase flex gap-2 flex-wrap mt-0.5">
                              <span>🔥 {recipe.nutrition?.calories || 0} kcal</span>
                              <span>• 🥩 {recipe.nutrition?.protein || 0}g</span>
                              <span>• 🌾 {recipe.nutrition?.carbs || 0}g</span>
                              <span>• 🥑 {recipe.nutrition?.fat || 0}g</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
`;

const newFilterBlock = `
                    <div className="flex flex-col gap-3">
                      {(() => {
                        const filteredRecipes = availableRecipes.filter(recipe => {
                          if (!targetSlot || !weeklyPlan) return true;
                          const currentPeriod = weeklyPlan.days[targetSlot.dayIndex].meals[targetSlot.mealIndex].name;
                          const courseType = weeklyPlan.days[targetSlot.dayIndex].meals[targetSlot.mealIndex].courses[targetSlot.courseIndex].type;
                          
                          if (activeProfile?.approvedRecipes && activeProfile.approvedRecipes.length > 0) {
                            const isApproved = activeProfile.approvedRecipes.some(r => r.recipeId === recipe.id && r.period === currentPeriod);
                            if (!isApproved) return false;
                          }
                          
                          const rawCat = recipe.category;
                          const p = Array.isArray(rawCat) ? rawCat : (rawCat ? [rawCat] : []);
                          const rawMom = (recipe as any).momento;
                          const m = Array.isArray(rawMom) ? rawMom : (rawMom ? [rawMom] : []);
                          
                          const isDrink = p.includes("Bebidas") || m.includes("Bebidas");
                          const isDessert = p.includes("Doces e Sobremesas");
                          const isSnack = m.includes("Lanche / Chá da Tarde") || m.includes("Petiscos&Food Tricks") || p.includes("Padaria e Pastelaria") || m.includes("Café da Manhã") || m.includes("Ceia");
                          const isStarter = m.includes("Entradas") || p.includes("Saladas e Pratos Frios") || m.includes("Sopas e Caldos");

                          switch (courseType) {
                            case "Entrada": return isStarter || isSnack;
                            case "Sobremesa": return isDessert;
                            case "Bebida": return isDrink;
                            case "Lanche": return isSnack || isDessert || p.includes("Massas e Risotos");
                            case "Prato Principal": return !(isDrink || isDessert || m.includes("Entradas") || p.includes("Bebidas"));
                            default: return true;
                          }
                        });

                        return (
                          <>
                            {filteredRecipes.slice(0, visibleRecipesCount).map((recipe) => (
                              <div
                                key={recipe.id}
                                className="border border-outline-variant/30 rounded-xl p-2 flex gap-3 items-center hover:border-primary active:bg-sage-wash cursor-pointer transition-all bg-white"
                                onClick={() => handleSelectRecipe(recipe)}
                              >
                                <img src={recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80"} alt={recipe.title} className="w-14 h-14 rounded-lg object-cover" />
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-sm font-semibold text-primary truncate">{recipe.title}</h4>
                                  <span className="font-sans text-[10px] text-scientific-gray uppercase flex gap-2 flex-wrap mt-0.5">
                                    <span>🔥 {recipe.nutrition?.calories || 0} kcal</span>
                                    <span>• 🥩 {recipe.nutrition?.protein || 0}g</span>
                                    <span>• 🌾 {recipe.nutrition?.carbs || 0}g</span>
                                    <span>• 🥑 {recipe.nutrition?.fat || 0}g</span>
                                  </span>
                                </div>
                              </div>
                            ))}
                            
                            {filteredRecipes.length > visibleRecipesCount && (
                              <button
                                onClick={() => setVisibleRecipesCount(prev => prev + 10)}
                                className="w-full py-2 border border-outline-variant rounded-xl text-primary font-medium hover:bg-sage-wash transition-colors text-sm"
                              >
                                Mostrar mais ({filteredRecipes.length - visibleRecipesCount})
                              </button>
                            )}

                            {filteredRecipes.length === 0 && (
                              <div className="text-center py-8 text-on-surface-variant/60 text-sm">
                                Nenhuma receita compatível com este momento.
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
`;

content = content.replace(oldFilterBlock.trim(), newFilterBlock.trim());

fs.writeFileSync(path, content, 'utf8');
console.log("Updated CompactWeeklyPlanner.tsx");
