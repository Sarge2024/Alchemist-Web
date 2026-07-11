import React, { useState, useRef, useEffect, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { productService } from "../services/productService";
import { apiService } from "../services/apiService";
import { IndustrialProduct } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Camera, X, Package, Loader2, AlertTriangle, Check, Keyboard, ArrowRight, Upload } from "lucide-react";

interface ProductScannerProps {
  onProductRegistered: (product: IndustrialProduct) => void;
  onClose: () => void;
}

type ScannerStep = "scanning" | "loading" | "found" | "not-found" | "manual" | "manual-ean" | "price-input";

export default function ProductScanner({ onProductRegistered, onClose }: ProductScannerProps) {
  const [step, setStep] = useState<ScannerStep>("scanning");
  const [foundProduct, setFoundProduct] = useState<IndustrialProduct | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [cameraError, setCameraError] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "barcode-scanner-container";

  // Formulário manual
  const [manualName, setManualName] = useState("");
  const [manualBrand, setManualBrand] = useState("");
  const [manualBarcode, setManualBarcode] = useState("");
  const [manualCalories, setManualCalories] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFat, setManualFat] = useState("");
  const [manualPortionSize, setManualPortionSize] = useState("100");
  const [manualPortionUnit, setManualPortionUnit] = useState("g");
  const [saving, setSaving] = useState(false);

  // EAN manual input
  const [manualEan, setManualEan] = useState("");

  // Price, Volume and Image overrides
  const [productPrice, setProductPrice] = useState("");
  const [productVolume, setProductVolume] = useState("");
  const [productVolumeUnit, setProductVolumeUnit] = useState("g");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
        }
      } catch (e) {
        // Ignorar erros ao parar
      }
    }
  }, []);

  const lookupBarcode = useCallback(async (code: string) => {
    setStep("loading");
    setErrorMsg("");
    try {
      const result = await productService.getByBarcode(code);
      if (result.success && result.product) {
        setFoundProduct(result.product);
        setProductImageUrl(result.product.image || "");
        setStep("found");
      } else {
        setManualBarcode(code);
        setStep("not-found");
      }
    } catch (e) {
      setManualBarcode(code);
      setStep("not-found");
    }
  }, []);

  // Iniciar scanner
  useEffect(() => {
    if (step !== "scanning") return;

    let mounted = true;
    const timer = setTimeout(async () => {
      if (!mounted) return;

      try {
        const scanner = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
          ],
          verbose: false,
        });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 120 },
            aspectRatio: 1.5,
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true,
            },
          } as any,
          async (decodedText) => {
            // Código detectado — para o scanner e busca
            await stopScanner();
            lookupBarcode(decodedText);
          },
          () => {
            // Scan frame sem resultado — normal
          }
        );
      } catch (err) {
        console.error("Erro ao iniciar câmera:", err);
        if (mounted) setCameraError(true);
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [step, stopScanner, lookupBarcode]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const handleConfirmProduct = () => {
    if (foundProduct) {
      setStep("price-input");
    }
  };

  const handleFinalConfirm = async () => {
    if (foundProduct) {
      setSaving(true);
      setErrorMsg("");
      try {
        const updateData = {
          price: parseFloat(productPrice) || undefined,
          totalPackageSize: parseFloat(productVolume) || undefined,
          totalPackageUnit: productVolumeUnit,
          imageUrl: productImageUrl.trim() || undefined
        };
        const result = await productService.updateProduct(foundProduct.id, updateData);
        if (result.success && result.product) {
          onProductRegistered(result.product);
          // Reset state for next scan
          setFoundProduct(null);
          setProductPrice("");
          setProductVolume("");
          setProductImageUrl("");
          setStep("scanning");
        } else {
          setErrorMsg(result.error || "Erro ao salvar informações do produto.");
        }
      } catch (e) {
        setErrorMsg("Erro de conexão ao salvar informações do produto.");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMsg("");
    try {
      const result = await apiService.uploadImage(file);
      if (result.success && result.imageUrl) {
        setProductImageUrl(result.imageUrl);
      } else {
        setErrorMsg(result.error || "Erro ao fazer upload da imagem.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro de conexão ao enviar imagem.");
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleManualSubmit = async () => {
    if (!manualName.trim()) return;
    setSaving(true);
    setErrorMsg("");
    try {
      const result = await productService.registerProduct({
        name: manualName.trim(),
        brand: manualBrand.trim() || undefined,
        barcode: manualBarcode.trim() || undefined,
        calories: parseFloat(manualCalories) || 0,
        protein: parseFloat(manualProtein) || 0,
        carbohydrates: parseFloat(manualCarbs) || 0,
        lipids: parseFloat(manualFat) || 0,
        portionSize: parseFloat(manualPortionSize) || 100,
        portionUnit: manualPortionUnit || "g",
        imageUrl: productImageUrl.trim() || undefined,
        price: parseFloat(productPrice) || undefined,
        totalPackageSize: parseFloat(productVolume) || undefined,
        totalPackageUnit: productVolumeUnit
      });
      if (result.success && result.product) {
        onProductRegistered(result.product);
        // Reset state for next manual insert
        setManualName("");
        setManualBrand("");
        setManualBarcode("");
        setManualCalories("");
        setManualProtein("");
        setManualCarbs("");
        setManualFat("");
        setProductPrice("");
        setProductVolume("");
        setProductImageUrl("");
        setStep("scanning");
      } else {
        setErrorMsg(result.error || "Erro ao cadastrar produto.");
      }
    } catch (e) {
      setErrorMsg("Erro de conexão ao cadastrar produto.");
    } finally {
      setSaving(false);
    }
  };

  const handleManualEanSubmit = async () => {
    if (!manualEan.trim() || manualEan.trim().length < 8) return;
    await stopScanner();
    lookupBarcode(manualEan.trim());
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-lab-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            <h3 className="font-serif text-lg font-bold text-primary">
              {step === "scanning" || step === "manual-ean" ? "Scanner de Produto" :
               step === "loading" ? "Buscando..." :
               step === "found" ? "Produto Encontrado" :
               step === "not-found" ? "Não Encontrado" :
               step === "price-input" ? "Preço e Volume" :
               "Cadastro Manual"}
            </h3>
          </div>
          <button
            onClick={async () => { await stopScanner(); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-outline-variant/30 text-scientific-gray transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* ========== STEP: SCANNING ========== */}
            {step === "scanning" && (
              <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
                {cameraError ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                    <p className="font-sans text-sm text-scientific-gray mb-4">
                      Não foi possível acessar a câmera.<br />
                      Verifique as permissões do navegador.
                    </p>
                    <button
                      onClick={() => { setCameraError(false); setStep("manual-ean"); }}
                      className="px-4 py-2 bg-primary text-white rounded-lg font-sans text-xs font-bold hover:bg-primary/90 transition-all"
                    >
                      <Keyboard className="w-4 h-4 inline mr-1.5" />
                      Digitar Código Manualmente
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      id={scannerContainerId}
                      className="w-full rounded-xl overflow-hidden bg-black min-h-[250px]"
                    />
                    <p className="text-center font-sans text-[10px] text-scientific-gray mt-3 uppercase tracking-wider">
                      Aponte a câmera para o código de barras do produto
                    </p>
                    <button
                      onClick={async () => { await stopScanner(); setStep("manual-ean"); }}
                      className="mt-3 w-full py-2 text-primary font-sans text-xs font-bold hover:underline flex items-center justify-center gap-1.5"
                    >
                      <Keyboard className="w-3.5 h-3.5" />
                      Digitar código manualmente
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {/* ========== STEP: MANUAL EAN INPUT ========== */}
            {step === "manual-ean" && (
              <motion.div key="manual-ean" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5">
                <div className="text-center mb-5">
                  <Keyboard className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="font-sans text-sm text-scientific-gray">
                    Digite o código de barras do produto (EAN-13)
                  </p>
                </div>
                <input
                  type="text"
                  value={manualEan}
                  onChange={(e) => setManualEan(e.target.value.replace(/\D/g, ""))}
                  placeholder="Ex: 7891000100103"
                  maxLength={13}
                  className="w-full px-4 py-3 bg-lab-white border border-outline-variant/40 rounded-xl text-center text-lg font-mono tracking-widest outline-none focus:border-primary transition-colors"
                  autoFocus
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => { setStep("scanning"); setCameraError(false); }}
                    className="flex-1 py-2.5 border border-outline-variant/40 text-scientific-gray rounded-lg font-sans text-xs font-bold hover:bg-lab-white transition-all"
                  >
                    Voltar ao Scanner
                  </button>
                  <button
                    onClick={handleManualEanSubmit}
                    disabled={manualEan.length < 8}
                    className="flex-1 py-2.5 bg-primary text-white rounded-lg font-sans text-xs font-bold hover:bg-primary/90 transition-all disabled:opacity-40"
                  >
                    Buscar
                  </button>
                </div>
                <button
                  onClick={() => setStep("manual")}
                  className="mt-3 w-full py-2 text-primary font-sans text-xs font-bold hover:underline"
                >
                  Cadastrar sem código de barras
                </button>
              </motion.div>
            )}

            {/* ========== STEP: LOADING ========== */}
            {step === "loading" && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 text-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                <p className="font-sans text-sm font-bold text-scientific-gray">
                  Consultando base de dados...
                </p>
                <p className="font-sans text-[10px] text-scientific-gray/60 mt-1 uppercase tracking-wider">
                  Open Food Facts + Cache Local
                </p>
              </motion.div>
            )}

            {/* ========== STEP: FOUND ========== */}
            {step === "found" && foundProduct && (
              <motion.div key="found" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5">
                <div className="flex items-center gap-2 text-green-600 mb-4">
                  <Check className="w-5 h-5" />
                  <span className="font-sans text-xs font-bold uppercase tracking-wider">Produto Identificado</span>
                </div>

                <div className="bg-lab-white border border-outline-variant/30 rounded-xl p-4 flex gap-4 items-start">
                  {foundProduct.image ? (
                    <img src={foundProduct.image} alt={foundProduct.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-outline-variant/20 flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-scientific-gray" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-sans text-sm font-bold text-primary leading-tight">{foundProduct.name}</h4>
                    {foundProduct.brand && (
                      <span className="font-sans text-[10px] text-scientific-gray uppercase tracking-wider">{foundProduct.brand}</span>
                    )}
                    {foundProduct.barcode && (
                      <p className="font-mono text-[10px] text-scientific-gray/60 mt-0.5">EAN: {foundProduct.barcode}</p>
                    )}
                  </div>
                </div>

                {/* Tabela nutricional */}
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[
                    { label: "Cal", value: Math.round(foundProduct.nutrition.calories), unit: "kcal", color: "text-orange-500" },
                    { label: "Prot", value: Math.round(foundProduct.nutrition.protein), unit: "g", color: "text-red-500" },
                    { label: "Carb", value: Math.round(foundProduct.nutrition.carbs), unit: "g", color: "text-yellow-600" },
                    { label: "Gord", value: Math.round(foundProduct.nutrition.fat), unit: "g", color: "text-amber-500" },
                  ].map((item) => (
                    <div key={item.label} className="bg-white border border-outline-variant/30 rounded-xl p-2.5 text-center">
                      <span className="block text-[9px] text-scientific-gray font-bold uppercase tracking-wider">{item.label}</span>
                      <span className={`block text-sm font-black ${item.color}`}>{item.value}{item.unit}</span>
                    </div>
                  ))}
                </div>

                <p className="text-[9px] text-scientific-gray/60 text-center mt-2 uppercase tracking-wider">
                  Porção: {foundProduct.portionSize}{foundProduct.portionUnit} · Valores por 100g
                </p>

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => { setStep("scanning"); setFoundProduct(null); }}
                    className="flex-1 py-2.5 border border-outline-variant/40 text-scientific-gray rounded-lg font-sans text-xs font-bold hover:bg-lab-white transition-all"
                  >
                    Escanear Outro
                  </button>
                  <button
                    onClick={handleConfirmProduct}
                    className="flex-1 py-2.5 bg-primary text-white rounded-lg font-sans text-xs font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========== STEP: PRICE INPUT ========== */}
            {step === "price-input" && foundProduct && (
              <motion.div key="price-input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5">
                <div className="text-center mb-5">
                  <Package className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="font-sans text-sm text-scientific-gray">
                    Quase lá! Insira o preço pago e o tamanho total da embalagem para calcularmos o custo da receita.
                  </p>
                </div>
                
                {errorMsg && (
                  <div className="bg-red-50 text-red-700 text-xs font-bold p-2.5 rounded-lg border border-red-200 mb-4">
                    {errorMsg}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-scientific-gray uppercase tracking-wider mb-1">Imagem do Produto (Opcional)</label>
                    <div className="flex gap-4 items-center">
                      {productImageUrl ? (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-outline-variant/30 group">
                          <img src={productImageUrl} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setProductImageUrl("")}
                            className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="w-20 h-20 rounded-xl border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center text-scientific-gray hover:border-primary hover:text-primary transition-all bg-lab-white disabled:opacity-50"
                        >
                          {uploadingImage ? <Loader2 className="w-6 h-6 mb-1 animate-spin" /> : <Camera className="w-6 h-6 mb-1" />}
                          <span className="text-[9px] font-bold uppercase">{uploadingImage ? "Enviando" : "Foto"}</span>
                        </button>
                      )}
                      <div className="flex-1 space-y-2">
                        <button
                          type="button"
                          disabled={uploadingImage}
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 border border-outline-variant/40 rounded-lg text-xs font-bold text-scientific-gray hover:bg-lab-white transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Tirar ou Escolher Foto
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                        />
                        <p className="text-[9px] text-scientific-gray">
                          Tire uma foto direta ou selecione um arquivo. Ela será salva na nuvem.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-scientific-gray uppercase tracking-wider mb-1">Preço Total Pago (R$)</label>
                    <input type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="Ex: 15.90" className="w-full px-3 py-2 bg-lab-white border border-outline-variant/40 rounded-lg text-lg outline-none focus:border-primary" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-scientific-gray uppercase tracking-wider mb-1">Tamanho da Embalagem</label>
                      <input type="number" value={productVolume} onChange={(e) => setProductVolume(e.target.value)}
                        placeholder="Ex: 500" className="w-full px-3 py-2 bg-lab-white border border-outline-variant/40 rounded-lg text-lg outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-scientific-gray uppercase tracking-wider mb-1">Unidade</label>
                      <select value={productVolumeUnit} onChange={(e) => setProductVolumeUnit(e.target.value)}
                        className="w-full px-3 py-2.5 bg-lab-white border border-outline-variant/40 rounded-lg text-lg outline-none focus:border-primary">
                        <option value="g">Gramas (g)</option>
                        <option value="ml">Mililitros (ml)</option>
                        <option value="kg">Quilogramas (kg)</option>
                        <option value="l">Litros (l)</option>
                        <option value="unid">Unidades</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    disabled={saving}
                    onClick={() => { setErrorMsg(""); setStep("found"); }}
                    className="flex-1 py-2.5 border border-outline-variant/40 text-scientific-gray rounded-lg font-sans text-xs font-bold hover:bg-lab-white transition-all disabled:opacity-40"
                  >
                    Voltar
                  </button>
                  <button
                    disabled={saving}
                    onClick={handleFinalConfirm}
                    className="flex-1 py-2.5 bg-primary text-white rounded-lg font-sans text-xs font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {saving ? "Salvando..." : "Finalizar Cadastro"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========== STEP: NOT FOUND ========== */}
            {step === "not-found" && (
              <motion.div key="not-found" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 text-center">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                <p className="font-sans text-sm font-bold text-scientific-gray mb-1">
                  Produto não encontrado
                </p>
                <p className="font-sans text-[10px] text-scientific-gray/60 mb-4">
                  {manualBarcode && <>Código: <span className="font-mono">{manualBarcode}</span><br /></>}
                  Cadastre manualmente os dados nutricionais.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setStep("scanning"); setManualBarcode(""); }}
                    className="flex-1 py-2.5 border border-outline-variant/40 text-scientific-gray rounded-lg font-sans text-xs font-bold hover:bg-lab-white transition-all"
                  >
                    Tentar Outro
                  </button>
                  <button
                    onClick={() => setStep("manual")}
                    className="flex-1 py-2.5 bg-primary text-white rounded-lg font-sans text-xs font-bold hover:bg-primary/90 transition-all"
                  >
                    Cadastrar Manual
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========== STEP: MANUAL FORM ========== */}
            {step === "manual" && (
              <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-3">
                {errorMsg && (
                  <div className="bg-red-50 text-red-700 text-xs font-bold p-2.5 rounded-lg border border-red-200">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-scientific-gray uppercase tracking-wider mb-1">Nome do Produto *</label>
                  <input type="text" value={manualName} onChange={(e) => setManualName(e.target.value)}
                    placeholder="Ex: Leite Integral" className="w-full px-3 py-2 bg-lab-white border border-outline-variant/40 rounded-lg text-sm outline-none focus:border-primary" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-scientific-gray uppercase tracking-wider mb-1">Marca</label>
                    <input type="text" value={manualBrand} onChange={(e) => setManualBrand(e.target.value)}
                      placeholder="Ex: Piracanjuba" className="w-full px-3 py-2 bg-lab-white border border-outline-variant/40 rounded-lg text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-scientific-gray uppercase tracking-wider mb-1">Código de Barras</label>
                    <input type="text" value={manualBarcode} onChange={(e) => setManualBarcode(e.target.value.replace(/\D/g, ""))}
                      placeholder="EAN-13" maxLength={13} className="w-full px-3 py-2 bg-lab-white border border-outline-variant/40 rounded-lg text-sm font-mono outline-none focus:border-primary" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-scientific-gray uppercase tracking-wider mb-1">Imagem do Produto (Opcional)</label>
                  <div className="flex gap-4 items-center">
                    {productImageUrl ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-outline-variant/30 group">
                        <img src={productImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setProductImageUrl("")}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="w-20 h-20 rounded-xl border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center text-scientific-gray hover:border-primary hover:text-primary transition-all bg-lab-white disabled:opacity-50"
                      >
                        {uploadingImage ? <Loader2 className="w-6 h-6 mb-1 animate-spin" /> : <Camera className="w-6 h-6 mb-1" />}
                        <span className="text-[9px] font-bold uppercase">{uploadingImage ? "Enviando" : "Foto"}</span>
                      </button>
                    )}
                    <div className="flex-1 space-y-2">
                      <button
                        type="button"
                        disabled={uploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 border border-outline-variant/40 rounded-lg text-xs font-bold text-scientific-gray hover:bg-lab-white transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Tirar ou Escolher Foto
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                      />
                      <p className="text-[9px] text-scientific-gray">
                        Tire uma foto direta ou selecione um arquivo. Ela será salva na nuvem.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-outline-variant/20 pt-3">
                  <span className="text-[10px] font-bold text-scientific-gray uppercase tracking-wider">Informações Nutricionais (por 100g)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-scientific-gray uppercase tracking-wider mb-1">Calorias (kcal)</label>
                    <input type="number" value={manualCalories} onChange={(e) => setManualCalories(e.target.value)}
                      placeholder="0" className="w-full px-3 py-2 bg-lab-white border border-outline-variant/40 rounded-lg text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-scientific-gray uppercase tracking-wider mb-1">Proteínas (g)</label>
                    <input type="number" value={manualProtein} onChange={(e) => setManualProtein(e.target.value)}
                      placeholder="0" className="w-full px-3 py-2 bg-lab-white border border-outline-variant/40 rounded-lg text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-scientific-gray uppercase tracking-wider mb-1">Carboidratos (g)</label>
                    <input type="number" value={manualCarbs} onChange={(e) => setManualCarbs(e.target.value)}
                      placeholder="0" className="w-full px-3 py-2 bg-lab-white border border-outline-variant/40 rounded-lg text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-scientific-gray uppercase tracking-wider mb-1">Gorduras (g)</label>
                    <input type="number" value={manualFat} onChange={(e) => setManualFat(e.target.value)}
                      placeholder="0" className="w-full px-3 py-2 bg-lab-white border border-outline-variant/40 rounded-lg text-sm outline-none focus:border-primary" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-scientific-gray uppercase tracking-wider mb-1">Porção</label>
                    <input type="number" value={manualPortionSize} onChange={(e) => setManualPortionSize(e.target.value)}
                      className="w-full px-3 py-2 bg-lab-white border border-outline-variant/40 rounded-lg text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-scientific-gray uppercase tracking-wider mb-1">Unidade</label>
                    <select value={manualPortionUnit} onChange={(e) => setManualPortionUnit(e.target.value)}
                      className="w-full px-3 py-2 bg-lab-white border border-outline-variant/40 rounded-lg text-sm outline-none focus:border-primary">
                      <option value="g">Gramas (g)</option>
                      <option value="ml">Mililitros (ml)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className="block text-[10px] font-bold text-scientific-gray uppercase tracking-wider mb-1">Preço Total Pago (R$)</label>
                    <input type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="0.00" className="w-full px-3 py-2 bg-lab-white border border-outline-variant/40 rounded-lg text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-scientific-gray uppercase tracking-wider mb-1">Tamanho da Embalagem</label>
                    <div className="flex gap-1">
                      <input type="number" value={productVolume} onChange={(e) => setProductVolume(e.target.value)}
                        placeholder="Ex: 500" className="w-2/3 px-3 py-2 bg-lab-white border border-outline-variant/40 rounded-lg text-sm outline-none focus:border-primary" />
                      <select value={productVolumeUnit} onChange={(e) => setProductVolumeUnit(e.target.value)}
                        className="w-1/3 px-1 py-2 bg-lab-white border border-outline-variant/40 rounded-lg text-sm outline-none focus:border-primary">
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                        <option value="kg">kg</option>
                        <option value="l">l</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep("scanning")}
                    className="flex-1 py-2.5 border border-outline-variant/40 text-scientific-gray rounded-lg font-sans text-xs font-bold hover:bg-lab-white transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleManualSubmit}
                    disabled={!manualName.trim() || saving}
                    className="flex-1 py-2.5 bg-primary text-white rounded-lg font-sans text-xs font-bold hover:bg-primary/90 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {saving ? "Salvando..." : "Cadastrar"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
