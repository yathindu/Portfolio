export const DATA = {
  handle: "AI_OPERATIVE // y4thindu",
  name: "YATHINDU JAYAWARDENA",
  roles: ["AI Engineer", "Full-Stack Developer", "CS w/ AI Student"],
  location: "Kadugannawa, Sri Lanka",
  status: "OPEN TO INTERNSHIPS",
  tagline: "Access granted. Let's build something that matters.",
  resume: "assets/Yathindu_Jayawardena_CV.docx",

  profile: {
    occupation: "CS (AI) Student · Developer",
    followers: "11.2M",
    income: "$ NEGOTIABLE",
    threat: "FAST LEARNER // TEAM PLAYER",
    note: "Hard worker who picks up new stacks quickly — reliable solo or in a team.",
  },

  about: {
    headline: "The right person in the wrong place can make all the difference.",
    paragraphs: [
      "I'm a Computer Science (with AI) undergrad who learns fast and puts in the work — whether that's annotating hundreds of frames for a vision model, debugging firmware on a delivery robot, or building a full-stack app overnight with teammates. AI is part of my toolkit, not the whole story.",
      "I communicate clearly, adapt quickly to new tools and problem domains, and do my part so the team can move. Our 24-hour buildathon win came from how we split tasks and kept pushing together. Currently seeking an internship where effort, curiosity, and collaboration count.",
    ],
    stats: [
      { value: "24h",   label: "Full-stack prototype shipped" },
      { value: "96.7%", label: "YOLOv8 mAP@50" },
      { value: "84%",   label: "Cancer Detection Accuracy" },
      { value: "4+",    label: "Production Projects" },
    ],
  },

  skills: [
    { name: "AI Dev Tools (Cursor / Copilot / Claude)", level: 95 },
    { name: "LLM Integration (Groq · Fal AI · RAG)",   level: 86 },
    { name: "Prompt Engineering",                       level: 88 },
    { name: "Python (FastAPI · Flask · Streamlit)",     level: 85 },
    { name: "ML / CV (TensorFlow · OpenCV · YOLOv8)",  level: 82 },
    { name: "React / Node.js / JavaScript",             level: 80 },
    { name: "Databases (MongoDB · MySQL · Firebase)",   level: 78 },
    { name: "Git · Docker · Vercel · Netlify",          level: 80 },
  ],

  projects: [
    {
      id: "001", title: "ClearSight Recon", tag: "AI / FULL-STACK",
      description: "AI forensic composite-sketch generator. 1st place on the FAL Track at Cursor Buildathon 2026. Full-stack app with multilingual support and PDF export, delivered within a 24-hour constraint.",
      tech: ["React", "Vite", "Fal AI", "REST API", "Netlify"],
      repo: "https://github.com/ManujaJayasinghe/ClearSight-Recon",
    },
    {
      id: "002", title: "AML Cancer Classification", tag: "AI / LLM",
      description: "LLM-powered cancer-detection platform. Fused image (EfficientNetB0) and clinical tabular data (XGBoost) for 84.21% accuracy, with a Groq-powered chatbot enabling natural-language interaction over the pipeline.",
      tech: ["EfficientNetB0", "XGBoost", "TensorFlow", "Streamlit", "Groq API"],
      repo: "https://github.com/yathindu/AML_CANCER_CLASSIFICATION",
    },
    {
      id: "003", title: "Game HUD Event Detection", tag: "COMPUTER VISION",
      description: "End-to-end ML pipeline: annotated 659 Valorant frames, trained YOLOv8n to 96.75% mAP@50 and 92.5% precision across 4 HUD classes, with CLAHE preprocessing and Streamlit deployment.",
      tech: ["YOLOv8", "Python", "OpenCV", "Roboflow", "Streamlit"],
      repo: "https://github.com/yathindu/Game-hud-detection",
    },
    {
      id: "004", title: "Smart File Delivery Robot", tag: "IOT / ROBOTICS",
      description: "Dual-microcontroller delivery robot (Arduino + NodeMCU ESP8266) with IR line-following and ultrasonic obstacle detection, plus Firebase REST integration for real-time IoT comms with a web dashboard.",
      tech: ["Arduino", "ESP8266", "Firebase", "C/C++", "REST API"],
      repo: "https://github.com/yathindu/ROBODELIVER--smart-file-delivery-robot--",
    },
  ],

  contact: {
    email: "yathindurandira@gmail.com",
    socials: [
      { label: "GitHub",   url: "https://github.com/yathindu" },
      { label: "LinkedIn", url: "https://www.linkedin.com/in/yathindu-jayawardena-0a12a5395" },
      { label: "Email",    url: "mailto:yathindurandira@gmail.com" },
      { label: "Call",     url: "tel:+94715352551" },
    ],
  },
};
