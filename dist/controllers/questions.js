"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testQuestions = [
    // Nigerian History
    {
        question: "Who was the first Governor-General of Nigeria?",
        options: [
            "Nnamdi Azikiwe",
            "Ahmadu Bello",
            "Tafawa Balewa",
            "Herbert Macaulay",
        ],
    },
    {
        question: "In what year did Nigeria gain independence from British colonial rule?",
        options: ["1957", "1960", "1963", "1970"],
    },
    {
        question: "Which event marked the beginning of the Nigerian Civil War?",
        options: [
            "Biafra Declaration",
            "First Military Coup",
            "Oil Boom",
            "Lagos Riots",
        ],
    },
    {
        question: "Who was the leader of the Biafran secessionist movement?",
        options: [
            "Yakubu Gowon",
            "Odumegwu Ojukwu",
            "Murtala Mohammed",
            "Olusegun Obasanjo",
        ],
    },
    {
        question: "What was the name of the first Nigerian university, established in 1948?",
        options: [
            "University of Lagos",
            "University of Ibadan",
            "Ahmadu Bello University",
            "Obafemi Awolowo University",
        ],
    },
    {
        question: "Which Nigerian leader introduced the Structural Adjustment Programme (SAP) in 1986?",
        options: [
            "Ibrahim Babangida",
            "Sani Abacha",
            "Shehu Shagari",
            "Ernest Shonekan",
        ],
    },
    {
        question: "What was the primary export commodity of Nigeria during the colonial era?",
        options: ["Oil", "Cocoa", "Groundnuts", "Timber"],
    },
    {
        question: "Which pre-colonial empire was known for its bronze plaques and sculptures in Nigeria?",
        options: ["Oyo Empire", "Benin Kingdom", "Kanem-Bornu", "Igbo-Ukwu"],
    },
    {
        question: "Who was the first female Nigerian senator, elected in 1960?",
        options: [
            "Funmilayo Ransome-Kuti",
            "Margaret Ekpo",
            "Wuraola Esan",
            "Flora Azikiwe",
        ],
    },
    {
        question: "Which year marked the transition to Nigeria's Second Republic?",
        options: ["1975", "1979", "1983", "1999"],
    },
    // Technology
    {
        question: "What does the acronym HTTP stand for in web technology?",
        options: [
            "HyperText Transfer Protocol",
            "High Throughput Technology Protocol",
            "Hyperlink Text Transmission Process",
            "Hybrid Text Transfer Program",
        ],
    },
    {
        question: "Which programming language is primarily used for web development and is known for its asynchronous capabilities?",
        options: ["Python", "JavaScript", "Java", "Ruby"],
    },
    {
        question: "What is the primary function of a GPU in a computer system?",
        options: [
            "General Processing",
            "Graphics Rendering",
            "Data Storage",
            "Network Communication",
        ],
    },
    {
        question: "Which company developed the Android operating system?",
        options: ["Apple", "Microsoft", "Google", "Samsung"],
    },
    {
        question: "What is the main purpose of a firewall in network security?",
        options: [
            "Data Encryption",
            "Traffic Monitoring and Filtering",
            "File Compression",
            "User Authentication",
        ],
    },
    {
        question: "Which technology underpins cryptocurrencies like Bitcoin?",
        options: [
            "Blockchain",
            "Cloud Computing",
            "Artificial Intelligence",
            "Quantum Computing",
        ],
    },
    {
        question: "What does SQL stand for in database management?",
        options: [
            "Structured Query Language",
            "System Query Logic",
            "Sequential Query Layer",
            "Standardized Query Loop",
        ],
    },
    {
        question: "Which protocol is used for secure email communication?",
        options: ["SMTP", "IMAP", "POP3", "SMTPS"],
    },
    {
        question: "What is the primary goal of machine learning?",
        options: [
            "Hardware Optimization",
            "Data Visualization",
            "Predictive Modeling",
            "Network Configuration",
        ],
    },
    {
        question: "Which company is known for developing the TensorFlow framework?",
        options: ["Microsoft", "Google", "Amazon", "Facebook"],
    },
    // US Politics
    {
        question: "How many years is a U.S. presidential term?",
        options: ["2 years", "4 years", "6 years", "8 years"],
    },
    {
        question: "Which amendment to the U.S. Constitution guarantees the right to free speech?",
        options: [
            "First Amendment",
            "Second Amendment",
            "Fifth Amendment",
            "Tenth Amendment",
        ],
    },
    {
        question: "Who is the current Speaker of the U.S. House of Representatives as of October 2025?",
        options: [
            "Nancy Pelosi",
            "Kevin McCarthy",
            "Mike Johnson",
            "Hakeem Jeffries",
        ],
    },
    {
        question: "What is the minimum age requirement to run for President of the United States?",
        options: ["25", "30", "35", "40"],
    },
    {
        question: "Which political party is associated with the color blue in the U.S.?",
        options: [
            "Republican Party",
            "Democratic Party",
            "Libertarian Party",
            "Green Party",
        ],
    },
    {
        question: "What is the Electoral College's role in U.S. presidential elections?",
        options: [
            "Vetting Candidates",
            "Counting Popular Votes",
            "Officially Electing the President",
            "Regulating Campaign Funds",
        ],
    },
    {
        question: "Which U.S. president signed the Affordable Care Act into law?",
        options: ["George W. Bush", "Barack Obama", "Bill Clinton", "Donald Trump"],
    },
    {
        question: "How many justices serve on the U.S. Supreme Court?",
        options: ["7", "9", "11", "13"],
    },
    {
        question: "Which branch of the U.S. government is responsible for making laws?",
        options: ["Executive", "Legislative", "Judicial", "Administrative"],
    },
    {
        question: "What is the term length for a U.S. Senator?",
        options: ["2 years", "4 years", "6 years", "8 years"],
    },
    // Biology
    {
        question: "What is the primary source of energy for Earth's climate system?",
        options: [
            "Geothermal Heat",
            "Solar Radiation",
            "Ocean Currents",
            "Atmospheric Pressure",
        ],
    },
    {
        question: "Which molecule carries genetic information in most living organisms?",
        options: ["RNA", "DNA", "ATP", "Proteins"],
    },
    {
        question: "What is the process by which plants convert sunlight into energy?",
        options: ["Respiration", "Photosynthesis", "Fermentation", "Transpiration"],
    },
    {
        question: "Which organelle is known as the powerhouse of the cell?",
        options: ["Nucleus", "Mitochondrion", "Ribosome", "Golgi Apparatus"],
    },
    {
        question: "What type of cell division produces gametes in animals?",
        options: ["Mitosis", "Meiosis", "Binary Fission", "Budding"],
    },
    {
        question: "Which gas is primarily responsible for the greenhouse effect in Earth's atmosphere?",
        options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Helium"],
    },
    {
        question: "What is the primary function of red blood cells in humans?",
        options: [
            "Immune Defense",
            "Oxygen Transport",
            "Nutrient Storage",
            "Hormone Production",
        ],
    },
    {
        question: "Which part of the brain regulates basic bodily functions like breathing and heart rate?",
        options: ["Cerebrum", "Cerebellum", "Medulla Oblongata", "Hypothalamus"],
    },
    {
        question: "What is the term for an organism that can produce its own food?",
        options: ["Heterotroph", "Autotroph", "Decomposer", "Carnivore"],
    },
    {
        question: "Which structure in plant cells is responsible for storing water and nutrients?",
        options: ["Vacuole", "Chloroplast", "Cell Wall", "Nucleus"],
    },
    // Philosophy
    {
        question: "Who is known for the philosophical concept of the 'Categorical Imperative'?",
        options: [
            "John Stuart Mill",
            "Immanuel Kant",
            "Friedrich Nietzsche",
            "Søren Kierkegaard",
        ],
    },
    {
        question: "Which ancient Greek philosopher wrote 'The Republic'?",
        options: ["Aristotle", "Socrates", "Plato", "Epicurus"],
    },
    {
        question: "What is the main focus of existentialism?",
        options: [
            "Logic and Reason",
            "Individual Existence and Freedom",
            "Social Contracts",
            "Universal Truths",
        ],
    },
    {
        question: "Which philosopher is associated with the phrase 'I think, therefore I am'?",
        options: [
            "René Descartes",
            "David Hume",
            "Jean-Jacques Rousseau",
            "Baruch Spinoza",
        ],
    },
    {
        question: "What is utilitarianism primarily concerned with?",
        options: [
            "Duty and Obligation",
            "Maximizing Happiness",
            "Individual Rights",
            "Absolute Truth",
        ],
    },
    {
        question: "Who developed the concept of the 'Will to Power'?",
        options: [
            "Immanuel Kant",
            "Friedrich Nietzsche",
            "John Locke",
            "Thomas Hobbes",
        ],
    },
    {
        question: "Which philosophy emphasizes living in harmony with nature?",
        options: ["Stoicism", "Existentialism", "Nihilism", "Rationalism"],
    },
    {
        question: "Who is considered the father of Western philosophy?",
        options: ["Plato", "Socrates", "Aristotle", "Heraclitus"],
    },
    {
        question: "What is the primary concern of epistemology?",
        options: ["Ethics", "Knowledge and Belief", "Aesthetics", "Metaphysics"],
    },
    {
        question: "Which philosopher wrote 'Thus Spoke Zarathustra'?",
        options: [
            "Jean-Paul Sartre",
            "Friedrich Nietzsche",
            "Martin Heidegger",
            "Albert Camus",
        ],
    },
];
exports.default = testQuestions;
