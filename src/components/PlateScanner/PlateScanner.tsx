import React, { useState, useRef } from 'react';
import { Camera, Upload, Utensils, AlertCircle, CheckCircle2, ChevronRight, X, Loader2 } from 'lucide-react';
import { analyzePlateImage, PlateScannerResponse, ScannedItem } from '../../services/plateScannerApi';

export function PlateScanner() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [weight, setWeight] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlateScannerResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
      // Reset previous states
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imageSrc) {
      setError('Por favor, tire uma foto ou selecione uma imagem.');
      return;
    }
    const weightNum = parseFloat(weight);
    if (!weight || isNaN(weightNum) || weightNum <= 0) {
      setError('Por favor, insira um peso válido em gramas.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await analyzePlateImage(imageSrc, weightNum);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado ao analisar a imagem.');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (index: number) => {
    if (!result) return;
    const newItems = [...result.items];
    newItems.splice(index, 1);
    
    // Recalculate totals
    const newTotals = newItems.reduce((acc, item) => {
      acc.calories += item.calories;
      acc.carbohydrates += item.macronutrients.carbsGrams;
      acc.protein += item.macronutrients.proteinGrams;
      acc.lipids += item.macronutrients.fatGrams;
      return acc;
    }, { calories: 0, carbohydrates: 0, protein: 0, lipids: 0 });

    setResult({
      ...result,
      items: newItems,
      totalNutrients: newTotals
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
          <Utensils className="w-6 h-6 text-green-600" />
          Scanner de Prato
        </h2>
        <p className="text-gray-500 text-sm">
          Registre sua refeição fora de casa com precisão.
        </p>
      </div>

      {/* Upload & Image Preview Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div 
          className={`relative w-full h-64 rounded-xl overflow-hidden bg-gray-50 border-2 border-dashed flex flex-col items-center justify-center transition-colors ${imageSrc ? 'border-transparent' : 'border-gray-300 hover:border-green-500 hover:bg-green-50/50 cursor-pointer'}`}
          onClick={() => !imageSrc && fileInputRef.current?.click()}
        >
          {imageSrc ? (
            <>
              <img src={imageSrc} alt="Prato" className="w-full h-full object-cover" />
              <button 
                onClick={(e) => { e.stopPropagation(); setImageSrc(null); setResult(null); }}
                className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow-lg text-gray-700 hover:text-red-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="text-center space-y-3 pointer-events-none">
              <div className="flex justify-center gap-4">
                <div className="p-3 bg-green-100 rounded-full text-green-600">
                  <Camera className="w-6 h-6" />
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-700">Tirar foto ou enviar imagem</p>
                <p className="text-xs text-gray-500 mt-1">Toque para abrir a câmera</p>
              </div>
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden" 
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <input 
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Peso líquido do prato"
              className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
              g
            </span>
          </div>
          
          <button
            onClick={handleAnalyze}
            disabled={!imageSrc || !weight || loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analisar'}
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-end border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">{result.dishName}</h3>
              <p className="text-sm text-gray-500">Análise concluída ({result.inputTotalWeight}g)</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-green-600">{result.totalNutrients.calories.toFixed(0)}</p>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Kcal totais</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Alimentos Identificados
            </h4>
            
            <div className="space-y-2">
              {result.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 group">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => removeItem(idx)}
                      className="text-gray-400 hover:text-red-500 transition"
                      title="Remover item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{item.weightGrams}g ({item.percentage}%)</span>
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded uppercase font-medium">
                          {item.source}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-bold text-gray-700">{item.calories.toFixed(0)} kcal</p>
                    <p className="text-xs text-gray-500 gap-1 flex justify-end mt-0.5">
                      <span title="Carboidratos">C: {item.macronutrients.carbsGrams.toFixed(1)}</span>
                      <span title="Proteínas">P: {item.macronutrients.proteinGrams.toFixed(1)}</span>
                      <span title="Gorduras">G: {item.macronutrients.fatGrams.toFixed(1)}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition">
            Confirmar e Adicionar Refeição
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
