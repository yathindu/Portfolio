export const DATA = {
  // ---- Identity ----------------------------------------------------------
  handle: "AI_OPERATIVE // y4thindu",
  name: "YATHINDU JAYAWARDENA",
  roles: [
    "AI Engineer",
    "Full-Stack Developer",
    "CS w/ AI Student",
  ],
  location: "Kadugannawa, Sri Lanka",
  status: "OPEN TO INTERNSHIPS",
  tagline: "Access granted. Let's build something that matters.",
  resume: "assets/Yathindu_Jayawardena_CV.docx",   // file served for the EXTRACT CV download

  // ---- ctOS profiler card (the floating scan, Watch Dogs style) ----------
  profile: {
    occupation: "CS (AI) Student · Developer",
    followers: "11.2M",                 // DedSec-style follower flavor
    income: "$ NEGOTIABLE",
    threat: "FAST LEARNER // TEAM PLAYER",
    note: "Hard worker who picks up new stacks quickly — reliable solo or in a team.",
  },

  // ---- About / bio -------------------------------------------------------
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
      { value: "5+",    label: "Production Projects" },
    ],
  },

  // ---- Skills (value = proficiency 0-100) --------------------------------
  skills: [
    {
      name: "AI Dev Tools (Cursor / Copilot / Claude)", level: 80,
      research: { project: "ClearSight Recon", opId: "001", proof: "Built and shipped the full-stack buildathon MVP in 24h using Cursor + AI-assisted workflow." },
    },
    {
      name: "LLM Integration (Groq · Fal AI · RAG)", level: 65,
      research: { project: "AML Cancer Classification", opId: "002", proof: "Groq-powered chatbot over the cancer-detection pipeline; Fal AI image gen on ClearSight." },
    },
    {
      name: "Prompt Engineering", level: 80,
      research: { project: "ClearSight Recon", opId: "001", proof: "Structured prompts for multilingual forensic sketch generation and stable Fal AI outputs." },
    },
    {
      name: "Python (FastAPI · Flask · Streamlit)", level: 70,
      research: { project: "Game HUD Event Detection", opId: "003", proof: "Streamlit deployment for YOLOv8 HUD detector; Python pipelines for training and inference." },
    },
    {
      name: "ML / CV (TensorFlow · OpenCV · YOLOv8)", level: 70,
      research: { project: "Game HUD Event Detection", opId: "003", proof: "659-frame dataset, YOLOv8n at 96.75% mAP@50 with CLAHE preprocessing." },
    },
    {
      name: "React / Node.js / JavaScript / Three.js / Vanilla JS", level: 70,
      research: { project: "ClearSight Recon", opId: "001", proof: "React + Vite front end with PDF export and multilingual UI under hackathon deadline." },
    },
    {
      name: "Databases (MongoDB · MySQL · Firebase)", level: 70,
      research: { project: "Smart File Delivery Robot", opId: "004", proof: "Firebase REST integration for real-time IoT telemetry on the delivery robot dashboard." },
    },
    {
      name: "Git · Docker · Vercel · Netlify · GitHub Pages", level: 75,
      research: { project: "ClearSight Recon", opId: "001", proof: "Deployed production build to Netlify; versioned sprint work in Git across team ops." },
    },
  ],

  // ---- Projects ----------------------------------------------------------
  projects: [
    {
      id: "001",
      title: "ClearSight Recon",
      tag: "AI / FULL-STACK",
      description:
        "AI forensic composite-sketch generator. 1st place on the FAL Track at Cursor Buildathon 2026. Full-stack app with multilingual support and PDF export, delivered within a 24-hour constraint.",
      tech: ["React", "Vite", "Fal AI", "REST API", "Netlify"],
      repo: "https://github.com/ManujaJayasinghe/ClearSight-Recon",
      caseStudy: {
        problem: "Forensic teams need fast, usable composite sketches from witness descriptions — often under time pressure with no designer in the loop.",
        outcome: "1st place FAL Track at Cursor Buildathon 2026. Full-stack app with multilingual input, AI-generated sketches, and PDF export — shipped in 24 hours.",
        role: "Full-stack / AI integration",
      },
    },
    {
      id: "002",
      title: "AML Cancer Classification",
      tag: "AI / LLM",
      description:
        "LLM-powered cancer-detection platform. Fused image (EfficientNetB0) and clinical tabular data (XGBoost) for 84.21% accuracy, with a Groq-powered chatbot enabling natural-language interaction over the pipeline.",
      tech: ["EfficientNetB0", "XGBoost", "TensorFlow", "Streamlit", "Groq API"],
      repo: "https://github.com/yathindu/AML_CANCER_CLASSIFICATION",
      caseStudy: {
        problem: "Clinicians and researchers need one interface that combines image-based and tabular signals, not siloed notebooks.",
        outcome: "84.21% accuracy on fused modalities; Groq chatbot lets users query results in natural language via Streamlit.",
        role: "ML + LLM integration",
      },
    },
    {
      id: "003",
      title: "Game HUD Event Detection",
      tag: "COMPUTER VISION",
      description:
        "End-to-end ML pipeline: annotated 659 Valorant frames, trained YOLOv8n to 96.75% mAP@50 and 92.5% precision across 4 HUD classes, with CLAHE preprocessing and Streamlit deployment.",
      tech: ["YOLOv8", "Python", "OpenCV", "Roboflow", "Streamlit"],
      repo: "https://github.com/yathindu/Game-hud-detection",
      caseStudy: {
        problem: "Automating detection of HUD events in gameplay footage requires reliable labels across lighting and UI variants.",
        outcome: "96.75% mAP@50 and 92.5% precision on 4 classes after 659-frame annotation pass and CLAHE-augmented training.",
        role: "End-to-end CV pipeline",
      },
    },
    {
      id: "004",
      title: "Smart File Delivery Robot",
      tag: "IOT / ROBOTICS",
      description:
        "Dual-microcontroller delivery robot (Arduino + NodeMCU ESP8266) with IR line-following and ultrasonic obstacle detection, plus Firebase REST integration for real-time IoT comms with a web dashboard.",
      tech: ["Arduino", "ESP8266", "Firebase", "C/C++", "REST API"],
      repo: "https://github.com/yathindu/ROBODELIVER--smart-file-delivery-robot--",
      caseStudy: {
        problem: "Campus/office file handoff needed a low-cost autonomous carrier with live status, not manual runs.",
        outcome: "Line-following robot with obstacle avoidance and Firebase-backed dashboard for real-time telemetry.",
        role: "Firmware + IoT integration",
      },
    },
    {
      id: "005",
      title: "DedSec Portfolio",
      tag: "FRONTEND / CREATIVE",
      description:
        "Watch Dogs 2 / DedSec-themed developer portfolio. Live Three.js particle network with bloom post-processing, procedural WebAudio SFX, interactive ctOS shell terminal, hold-to-hack contact gate, and visitor profiler — no build step required.",
      tech: ["Three.js", "Vanilla JS", "WebAudio API", "CSS", "GitHub Pages"],
      repo: "https://github.com/yathindu/Portfolioo",
      caseStudy: {
        problem: "Stand out from generic portfolio templates — show personality, craft, and frontend depth in one experience.",
        outcome: "Fully interactive ctOS-themed portfolio with 3D background, procedural audio, terminal shell, and case study modals. You're looking at it.",
        role: "Design + full frontend build",
      },
    },
  ],

  // ---- Contact / socials -------------------------------------------------
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
