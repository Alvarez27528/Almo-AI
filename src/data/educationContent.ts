export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Lesson {
  id: string;
  title: string;
  topic: string;
  content: Record<Difficulty, string>;
}

export const educationContent: Lesson[] = [
  {
    id: 'compound-interest',
    title: 'Interés Compuesto',
    topic: 'Conceptos Básicos',
    content: {
      Beginner: 'Es el dinero que ganas sobre el dinero que ya has ganado. Es la forma más poderosa de hacer crecer tus ahorros a largo plazo.',
      Intermediate: 'El interés compuesto es la reinversión de los intereses generados, creando un efecto multiplicador donde el capital inicial crece exponencialmente.',
      Advanced: 'La fórmula A = P(1 + r/n)^(nt) demuestra cómo la frecuencia de capitalización (n) y la tasa de interés (r) afectan drásticamente el valor final del capital (P) a lo largo del tiempo.'
    }
  },
  {
    id: 'etfs-funds',
    title: 'ETFs y Fondos Indexados',
    topic: 'Inversión',
    content: {
      Beginner: 'Un fondo que compra muchas acciones a la vez para que no tengas que elegir una sola. Es como comprar una cesta de frutas en lugar de una sola manzana.',
      Intermediate: 'Son vehículos de inversión colectiva que replican un índice de mercado, ofreciendo diversificación instantánea y menores comisiones de gestión que los fondos activos.',
      Advanced: 'La gestión pasiva a través de ETFs minimiza el riesgo específico de empresa y optimiza los costes de transacción, permitiendo una exposición eficiente a clases de activos globales.'
    }
  },
  {
    id: 'diversification',
    title: 'Diversificación',
    topic: 'Gestión de Riesgo',
    content: {
      Beginner: 'No poner todos los huevos en la misma cesta. Si una inversión va mal, las otras pueden ir bien.',
      Intermediate: 'Estrategia que reduce el riesgo no sistemático al distribuir las inversiones entre diferentes activos, sectores y geografías.',
      Advanced: 'La diversificación eficiente se basa en correlaciones negativas entre activos para optimizar la frontera eficiente de la cartera y maximizar el retorno ajustado al riesgo (Ratio de Sharpe).'
    }
  }
];
