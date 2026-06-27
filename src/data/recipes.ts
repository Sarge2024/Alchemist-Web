import { Recipe } from "../types";

export const preloadedRecipes: Recipe[] = [
  {
    id: "rec-omega",
    name: "Formulação de Ômega-3 do Atlântico",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBVZW3qdkESuLtLBpAsfnPRarrk1VWRDdtC9OTTvdmPrgGE094MwtE-wcbcPmeyspy3OLIkW9yz-KdrbV4uOyH3kWvfslF6bnrLr7qbllMmzABmWp2LOvfV5eF_IyBxkjGbN0gxo1UmT2cJdl8Mzga3e-Ld6gQmGDnn5YWBHR6CCdkrYQ4WGqeIemPFRDqWtgxGYaTrkzo1AeMeQrCWTZF3-3e52a2Ji0KhwfOgI7u5KTLCu11CWOrur7JjDVi7zk6IvlJJL5b8yOk3",
    category: "CETOGÊNICA",
    calories: 420,
    protein: 32,
    carbs: 4,
    fat: 28,
    prepTime: "25m",
    description: "Saboroso filé de salmão grelhado rico em ácidos graxos essenciais e antioxidantes, servido com aspargos selecionados e ervas finas."
  },
  {
    id: "rec-quinoa",
    name: "Bowl de Quinoa Bio-Disponível",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDglWvRBGQw-wNxnKeCQpBiV-LV7ZcGY3VPa-D3tRQ2x9wKbi4RG5HGGu1HOiintF5anEQXemWAeUbdgVtk86zyVWONp6VyflwMIKPr6dvoS9DIH7qIdNCvTYs8WgqfFvrruhJaWK5eyEHTXIePj0_C61odLuy1fMoZUMhd3fPLcqLTb4v4AGWOYVxfYfI932Web4sFtW9O8GLgtKHSLOCYLZ-kkWjhE0RsQrW9ReFLV-UZhlM3vn7c4Kb-QJYAWj56i_qpZAfNuhpY",
    category: "ALTA PROTEÍNA",
    calories: 510,
    protein: 24,
    carbs: 62,
    fat: 12,
    prepTime: "30m",
    description: "Equilíbrio perfeito de carboidratos complexos e proteínas bio-disponíveis. Quinoa com ovo pochê, batata doce e couve fresca."
  },
  {
    id: "rec-clorofila",
    name: "Tônico de Extrato de Clorofila",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDFnnqvRrqGTvPTfWUjYuxkQemtng33mLo5w0B3X64FdmvfQn0_v-2EHSN5kqYLj8UtgwXD6zAuUvVngWql3O1MoMl3GFpKqThIUHJRjrMn1k0TenS3GHznYXL4GcylK-nvQJc0CpnUdVJpnsOuqNTNOxqXfO8SCnZpkTyKgT2tMsNpUm0m29gQm7SVCYruoqwt7px-4w4IFIyAe7YFyX7_aoNWR4JDgx-qzrtFXZQIpz_8mcA3ecL6I5GAF2EnKXtblFp3d9hGp6Rp",
    category: "BAIXO CARBO",
    calories: 280,
    protein: 18,
    carbs: 14,
    fat: 22,
    prepTime: "15m",
    description: "Extrato concentrado de folhas verdes, abacate e sementes selecionadas para revitalização celular e energia imediata de baixo índice glicêmico."
  },
  {
    id: "rec-poultry",
    name: "Espécime de Ave Selada em Nitrogênio",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuACXL2nOFeULW8UZYhSccKOfZZkdcH5zi8x9nZWHvl9GylH9cF90UAVhv1KMe_ARZ67P9faGrr3mblQi7bdvsXMWgo943fLB8lKzV5f9KGnzhDvWmGiMfuFJZo0pogHzg9Kc1tufNfOd0XNuxmv4AxNHdwOV1ZsoveIMcwTKLjLM_Tf0Bwj3waxzmIoJgXhopUCThP6IPBvg4cUEUC3GoJRB5UoPFGBtaw72sSx6hq9OzQbnl2BawaHGogCGzzbV0qFk-pya7iFQtEM",
    category: "ALTA PROTEÍNA",
    calories: 385,
    protein: 48,
    carbs: 8,
    fat: 12,
    prepTime: "40m",
    description: "Otimizado para rápida recuperação tecidual e síntese muscular através de proporções precisas de aminoácidos estruturais e vegetais grelhados."
  },
  {
    id: "rec-berry",
    name: "Catalisador de Frutas Vermelhas e Polifenóis",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuASfH__DJrDRNCVe2L34cgF5Gfjhy_bSFgKKiC_Z4pIaFACJ-zyNLr9HN7OM4yUySn8aEs5_izYkBdl6BcEDnPADaXf7lBejR8g-0sNHhMSoG1iesCkkgxk-OaCAK72uBLzcuKLQZ13i2D4fTrmVillY1OXPSdkHVTC9PEZ9qn73OFRJh0amzE2Zt0BVqRxwAdlL9JkXh74bmpIcCNpo4Yp_lAi2iORXRtw34AAAjpH1ktfkFvVzW-gh9b2W6CG8bge_KbsndYmPLnA",
    category: "SEM AÇÚCAR",
    calories: 190,
    protein: 6,
    carbs: 18,
    fat: 10,
    prepTime: "10m",
    description: "Pudim de sementes enriquecido com mirtilos, amoras e polifenóis de cacau amargo. Adoçado com estévia pura para saúde mitocondrial."
  },
  {
    id: "rec-chia",
    name: "Tigela de Chia Antioxidante",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBmWs8m-BLMk0DymuwblIOBT233tJlAfhHbhBkgayiCoav-OvEMozZc56hVgpaYzt5E5n9pWD-jxZzA_9DsPqd0GVM7rP_fSw5GFtJ6lT1tL75Fd3ugKdlRJqW48sAeCh3wdUTJtHIVbkK9S6tYdTCHpySL8jKC4d7WzWnealPAz616mqqpo77UbMS3QFsyzCYb7BMRAx2oTdOzf9uVg3x1M4VDFJTZiXbGwvLEPyUeScKqZMuqVpNQJHMPgpO11YDSvIuX62WDc4NZ",
    category: "VEGAN",
    calories: 320,
    protein: 12,
    carbs: 22,
    fat: 14,
    prepTime: "15m",
    description: "Chia hidratada em leite vegetal de amêndoas, decorada com frutas vermelhas selecionadas e lascas de coco cru para energia e saciedade prolongadas."
  },
  {
    id: "rec-chicken",
    name: "Prato Macro-Balanceado de Frango",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCLkQ0pSMJKjKyR_KbvY0ODff-_XZAT3sEgze0TnsZCf_NK8JH7w9b2L-kAU87l0w3Ym6M3HYRtNFr7xlLDXMjQjHW20KZLd8fPDnU3d8rBpzwtMVnQr8XqwiQ08ygL0neDQjfHHCjPokR5yYRtwQFeDdj5n1jULUldL4ar7tqgRsparOG2EYIdTnBnqebLvYQ8csAPmy3Nm9h-g4fgMwnprcueFrlX35d6KlE1Qf3ORnRjNrnCT6V8VlT0C82mWRS9AwouFL7SD-AN",
    category: "ALTA PROTEÍNA",
    calories: 550,
    protein: 45,
    carbs: 38,
    fat: 16,
    prepTime: "30m",
    description: "Fórmula clássica de almoço corporativo de alta performance. Peito de frango grelhado perfeitamente temperado, brócolis cozido no vapor e porção precisa de arroz selvagem."
  }
];
