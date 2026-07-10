import React, { useState } from 'react';
import { PlateScanner } from './PlateScanner/PlateScanner';
import ProductScanner from './ProductScanner';
import { IndustrialProduct } from '../types';
import { Package, Utensils, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ScannerTab() {
  const [activeTab, setActiveTab] = useState<'plate' | 'product'>('plate');
  const [toast, setToast] = useState<string | null>(null);

  const handleProductRegistered = (product: IndustrialProduct) => {
    setToast(`${product.name} cadastrado com sucesso!`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-full gap-4 pb-20">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-primary text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Tabs */}
      <div className="flex bg-surface-container-high rounded-xl p-1 shadow-inner sticky top-0 z-10 mx-4 mt-4">
        <button
          onClick={() => setActiveTab('plate')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'plate'
              ? 'bg-white text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Utensils className="w-4 h-4" />
          Pratos (Refeições)
        </button>
        <button
          onClick={() => setActiveTab('product')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'product'
              ? 'bg-white text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Package className="w-4 h-4" />
          Produtos (Barcode)
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeTab === 'plate' ? (
          <div className="pt-2">
            <PlateScanner />
          </div>
        ) : (
          <div className="pt-2 flex justify-center items-start min-h-[60vh]">
            <ProductScanner 
              onProductRegistered={handleProductRegistered} 
              onClose={() => setActiveTab('plate')} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
