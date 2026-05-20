// config/news-topics-config.js
export const NEWS_TOPICS = [
  {
    id: "business-management",
    name: "Gestão Empresarial",
    keywords: ["gestão empresarial", "estratégia", "liderança"],
    language: "pt"
  },
  {
    id: "artificial-intelligence",
    name: "Inteligência Artificial",
    keywords: ["inteligência artificial", "IA", "machine learning"],
    language: "pt"
  },
  {
    id: "digital-transformation",
    name: "Transformação Digital",
    keywords: ["transformação digital", "tecnologia", "inovação"],
    language: "pt"
  },
  {
    id: "turnarounds",
    name: "Turnarounds",
    keywords: ["turnaround", "reestruturação", "crise"],
    language: "pt"
  },
  {
    id: "zero-based-budgeting",
    name: "OBZ (Orçamento Base Zero)",
    keywords: ["orçamento base zero", "OBZ", "eficiência"],
    language: "pt"
  },
  {
    id: "disruptive-innovations",
    name: "Inovações Disruptivas",
    keywords: ["disruptivo", "inovação", "startup"],
    language: "pt"
  },
  {
    id: "automation",
    name: "Automação",
    keywords: ["automação", "robótica", "processo"],
    language: "pt"
  },
  {
    id: "production-robotics",
    name: "Robótica de Produção",
    keywords: ["robótica", "produção", "automação"],
    language: "pt"
  }
];

export const NEWS_LOOKBACK_DAYS = 7;
export const EXCLUDE_KEYWORDS = ["celebridade", "famoso", "esportes", "futebol"];
export const RELEVANCE_SCORE_THRESHOLD = 0.6;

export const SEARCH_SCHEDULE = {
  monday: ["business-management", "artificial-intelligence"],
  tuesday: ["digital-transformation", "turnarounds"],
  wednesday: ["zero-based-budgeting", "disruptive-innovations"],
  thursday: ["automation", "production-robotics"],
  searchTime: "06:00"
};

export const PUBLISH_SCHEDULE = {
  tuesday: ["business-management", "artificial-intelligence"],
  wednesday: ["turnarounds"],
  thursday: ["disruptive-innovations"],
  friday: ["production-robotics"],
  publishTime: "08:00"
};